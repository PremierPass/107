// Fire Study Hub: accounts and cloud save (Firebase Auth + Firestore).
// Each page defines window.appSync = { key, get(), set(data), merge(local, cloud) } before this module loads,
// and calls window.cloudChanged() whenever its saved progress changes.
import { firebaseConfig } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const configured = firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE');

const css = `
.acct-btn{background:#2a2a2a;border:1px solid #444;color:#e2aa3c;padding:7px 12px;border-radius:999px;font:600 12px 'Segoe UI',Arial,sans-serif;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.acct-btn:hover{border-color:#e2aa3c}
.acct-dot{width:8px;height:8px;border-radius:50%;background:#666}
.acct-btn.in .acct-dot{background:#27ae60}
.nav .acct-btn{flex-shrink:0;margin:0 8px 0 0;padding:6px 10px}
.acct-float{position:absolute;top:14px;right:14px;z-index:20}
.acct-ov{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;z-index:9999;padding:16px}
.acct-ov.open{display:flex}
.acct-box{width:100%;max-width:380px;background:#1a1a1a;border:1px solid #333;border-top:4px solid #c0392b;border-radius:12px;padding:22px;color:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif;position:relative}
.acct-box h3{font-size:18px;margin:0 0 4px}
.acct-box p.s{font-size:12px;color:#999;margin:0 0 14px;line-height:1.5}
.acct-box input{width:100%;box-sizing:border-box;background:#111;border:1px solid #444;color:#f0f0f0;border-radius:8px;padding:11px 12px;font-size:15px;margin-bottom:10px}
.acct-box input:focus{outline:none;border-color:#c0392b}
.acct-main{width:100%;background:#c0392b;color:#fff;border:0;border-radius:8px;padding:11px;font-weight:700;font-size:14px;cursor:pointer}
.acct-main:disabled{opacity:.6}
.acct-alt{width:100%;background:#fff;color:#222;border:0;border-radius:8px;padding:10px;font-weight:600;font-size:14px;cursor:pointer;margin-top:10px}
.acct-row{display:flex;justify-content:space-between;margin-top:12px;font-size:12px}
.acct-row a{color:#e2aa3c;cursor:pointer;text-decoration:none}
.acct-msg{font-size:12px;margin:2px 0 10px;min-height:16px;line-height:1.4}
.acct-msg.err{color:#e74c3c}.acct-msg.ok{color:#2ecc71}
.acct-x{position:absolute;top:10px;right:12px;background:none;border:0;color:#888;font-size:20px;cursor:pointer}
.acct-or{text-align:center;color:#666;font-size:11px;margin:12px 0 0;letter-spacing:.1em}
`;

if (configured) start(); else window.dispatchEvent(new CustomEvent('firehub-unconfigured'));

async function start() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(SDK + 'firebase-app.js'),
    import(SDK + 'firebase-auth.js'),
    import(SDK + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);
  const sync = window.appSync || null;
  let user = null, timer = null, ready = false;

  // ---------- UI ----------
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const btn = document.createElement('button'); btn.className = 'acct-btn'; btn.type = 'button';
  btn.innerHTML = '<span class="acct-dot"></span><span class="acct-lbl">Sign in</span>';
  const nav = document.querySelector('.nav');
  if (nav) { const t = nav.querySelector('.nav-title'); t ? t.after(btn) : nav.prepend(btn); } else { btn.classList.add('acct-float'); (document.querySelector('header') || document.body).appendChild(btn); }

  const ov = document.createElement('div'); ov.className = 'acct-ov';
  ov.innerHTML = `<div class="acct-box" role="dialog" aria-modal="true">
    <button class="acct-x" aria-label="Close">&times;</button>
    <div class="acct-view"></div></div>`;
  document.body.appendChild(ov);
  const view = ov.querySelector('.acct-view');
  ov.addEventListener('click', e => { if (e.target === ov || e.target.classList.contains('acct-x')) ov.classList.remove('open'); });
  btn.addEventListener('click', () => { render(user ? 'account' : 'signin'); ov.classList.add('open'); });

  const friendly = e => ({
    'auth/invalid-email': 'That email address doesn\'t look right.',
    'auth/missing-password': 'Enter a password.',
    'auth/weak-password': 'Password needs at least 6 characters.',
    'auth/email-already-in-use': 'An account with that email already exists. Try signing in.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'No account with that email. Create one instead.',
    'auth/too-many-requests': 'Too many tries. Wait a few minutes and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
    'auth/operation-not-allowed': 'That sign-in method isn\'t turned on yet in Firebase.',
    'auth/unauthorized-domain': 'This website address isn\'t on the Firebase authorized domains list yet.',
    'auth/network-request-failed': 'No internet connection.'
  }[e.code] || ('Something went wrong: ' + (e.code || e.message)));

  function render(mode) {
    if (mode === 'account') {
      view.innerHTML = `<h3>Your account</h3><p class="s">Signed in as <b style="color:#fff">${esc(user.email || user.displayName || 'user')}</b>.<br>Your flashcard marks, missed questions, and prerequisite checklist save to this account and follow you to any device.</p>
        <div class="acct-msg ok">${sync ? (ready ? 'Progress is synced.' : 'Syncing...') : ''}</div>
        <a class="acct-main" href="account.html" style="display:block;text-align:center;text-decoration:none;box-sizing:border-box">My Account &amp; Certificates</a>
        <button class="acct-alt" data-a="out" style="background:#2a2a2a;color:#ddd;border:1px solid #444">Sign out</button>`;
    } else if (mode === 'reset') {
      view.innerHTML = `<h3>Reset password</h3><p class="s">We'll email you a link to set a new password.</p>
        <input type="email" placeholder="Email" autocomplete="email" class="f-email">
        <div class="acct-msg"></div><button class="acct-main" data-a="reset">Send reset link</button>
        <div class="acct-row"><a data-v="signin">Back to sign in</a></div>`;
    } else {
      const up = mode === 'signup';
      view.innerHTML = `<h3>${up ? 'Create an account' : 'Sign in'}</h3>
        <p class="s">Save your review list, missed questions, and checklist so they follow you to any device.</p>
        <input type="email" placeholder="Email" autocomplete="email" class="f-email">
        <input type="password" placeholder="Password${up ? ' (6+ characters)' : ''}" autocomplete="${up ? 'new-password' : 'current-password'}" class="f-pass">
        <div class="acct-msg"></div>
        <button class="acct-main" data-a="${up ? 'signup' : 'signin'}">${up ? 'Create account' : 'Sign in'}</button>
        <div class="acct-or">OR</div>
        <button class="acct-alt" data-a="google">Continue with Google</button>
        <div class="acct-row">${up ? '<a data-v="signin">I already have an account</a><span></span>' : '<a data-v="signup">Create an account</a><a data-v="reset">Forgot password?</a>'}</div>`;
    }
    view.querySelectorAll('[data-v]').forEach(a => a.onclick = () => render(a.dataset.v));
    view.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(b.dataset.a, b));
    view.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') view.querySelector('.acct-main').click(); }));
    const f = view.querySelector('input'); if (f) setTimeout(() => f.focus(), 50);
  }

  async function act(a, b) {
    const msg = view.querySelector('.acct-msg');
    const email = (view.querySelector('.f-email') || {}).value?.trim();
    const pass = (view.querySelector('.f-pass') || {}).value;
    const say = (t, ok) => { if (msg) { msg.textContent = t; msg.className = 'acct-msg ' + (ok ? 'ok' : 'err'); } };
    b.disabled = true;
    try {
      let isNew = false;
      if (a === 'signin') await A.signInWithEmailAndPassword(auth, email, pass);
      else if (a === 'signup') { await A.createUserWithEmailAndPassword(auth, email, pass); isNew = true; }
      else if (a === 'google') { const r = await A.signInWithPopup(auth, new A.GoogleAuthProvider()); isNew = !!A.getAdditionalUserInfo(r)?.isNewUser; }
      if (isNew && !/account\.html/.test(location.pathname)) { await flush(); setTimeout(() => location.href = 'account.html?welcome=1', 600); }
      else if (a === 'reset') { await A.sendPasswordResetEmail(auth, email); say('Check your email for the reset link.', true); }
      else if (a === 'out') { await flush(); await A.signOut(auth); ov.classList.remove('open'); }
      if (a === 'signin' || a === 'signup' || a === 'google') ov.classList.remove('open');
    } catch (e) { say(friendly(e)); }
    b.disabled = false;
  }

  // ---------- Sync ----------
  const docRef = () => F.doc(db, 'users', user.uid, 'progress', sync.key);

  async function pull() {
    ready = false;
    try {
      const snap = await F.getDoc(docRef());
      const cloud = snap.exists() ? snap.data().data : null;
      const local = sync.get();
      const merged = cloud ? (sync.merge ? sync.merge(local, cloud) : cloud) : local;
      sync.set(merged);
      await push(merged);
      ready = true;
    } catch (e) { console.warn('Cloud load failed', e); }
  }
  async function push(data) {
    if (!user || !sync) return;
    try {
      await F.setDoc(docRef(), { data: JSON.parse(JSON.stringify(data ?? sync.get())), updated: F.serverTimestamp(), email: user.email || null });
    } catch (e) { console.warn('Cloud save failed', e); }
  }
  async function flush() { if (timer) { clearTimeout(timer); timer = null; await push(); } }

  window.cloudChanged = () => {
    if (!user || !sync || !ready) return;
    clearTimeout(timer); timer = setTimeout(() => { timer = null; push(); }, 1200);
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  // Shared handle for pages that need Firebase directly (account.html).
  window.fireHub = { A, F, auth, db, user: () => user, openSignIn: (mode) => { render(mode || 'signin'); ov.classList.add('open'); } };

  A.onAuthStateChanged(auth, async u => {
    user = u;
    btn.classList.toggle('in', !!u);
    btn.querySelector('.acct-lbl').textContent = u ? (sync ? 'Saved' : 'Account') : 'Sign in';
    if (u && sync) await pull();
    window.dispatchEvent(new CustomEvent('firehub-user', { detail: u }));
  });
  window.dispatchEvent(new CustomEvent('firehub-ready'));
}

function esc(s) { return String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
