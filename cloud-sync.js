// Fire Study Hub: accounts, roles, invite-only access, cloud save, and question flagging.
// Firebase Auth + Firestore (free Spark plan, no server code).
//
// Pages can set, before this module loads:
//   window.appSync = { key, get(), set(data), merge(local, cloud) }   -> progress saved per account
//   <html data-gate>                                                  -> page requires an invited account
// Pages can call:
//   window.cloudChanged()                        -> progress changed, save soon
//   window.cloudLog({app, score, total, byCh})   -> record a finished quiz
//   window.fireFlag({app, ch, q, answer})        -> open the "flag this question" form
import { firebaseConfig, ADMIN_EMAILS } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const configured = firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE');
const gated = document.documentElement.hasAttribute('data-gate');
const admins = (ADMIN_EMAILS || []).map(e => e.toLowerCase());

const css = `
.acct-btn{background:#2a2a2a;border:1px solid #444;color:#e2aa3c;padding:7px 12px;border-radius:999px;font:600 12px 'Segoe UI',Arial,sans-serif;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.acct-btn:hover{border-color:#e2aa3c}
.acct-dot{width:8px;height:8px;border-radius:50%;background:#666}
.acct-btn.in .acct-dot{background:#27ae60}
.nav .acct-btn{flex-shrink:0;margin:0 8px 0 0;padding:6px 10px}
.acct-float{position:absolute;top:14px;right:14px;z-index:20}
.acct-ov{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;z-index:9999;padding:16px}
.acct-ov.open{display:flex}
.acct-box{width:100%;max-width:400px;max-height:92vh;overflow:auto;background:#1a1a1a;border:1px solid #333;border-top:4px solid #c0392b;border-radius:12px;padding:22px;color:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif;position:relative;box-sizing:border-box}
.acct-box h3{font-size:18px;margin:0 0 4px}
.acct-box p.s{font-size:12px;color:#999;margin:0 0 14px;line-height:1.5}
.acct-box input,.acct-box textarea{width:100%;box-sizing:border-box;background:#111;border:1px solid #444;color:#f0f0f0;border-radius:8px;padding:11px 12px;font-size:15px;margin-bottom:10px;font-family:inherit}
.acct-box textarea{min-height:90px;resize:vertical}
.acct-box input:focus,.acct-box textarea:focus{outline:none;border-color:#c0392b}
.acct-main{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;background:#c0392b;color:#fff;border:0;border-radius:8px;padding:11px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}
.acct-main:disabled{opacity:.6}
.acct-alt{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;background:#fff;color:#222;border:0;border-radius:8px;padding:10px;font-weight:600;font-size:14px;cursor:pointer;margin-top:10px;font-family:inherit}
.acct-alt.dark{background:#2a2a2a;color:#ddd;border:1px solid #444}
.acct-row{display:flex;justify-content:space-between;margin-top:12px;font-size:12px}
.acct-row a{color:#e2aa3c;cursor:pointer;text-decoration:none}
.acct-msg{font-size:12px;margin:2px 0 10px;min-height:16px;line-height:1.4}
.acct-msg.err{color:#e74c3c}.acct-msg.ok{color:#2ecc71}
.acct-x{position:absolute;top:10px;right:12px;background:none;border:0;color:#888;font-size:20px;cursor:pointer}
.acct-or{text-align:center;color:#666;font-size:11px;margin:12px 0 0;letter-spacing:.1em}
.acct-q{background:#111;border:1px solid #333;border-radius:8px;padding:10px;font-size:13px;line-height:1.45;margin-bottom:10px;color:#ddd}
.acct-q b{color:#2ecc71;font-weight:600}
.acct-gate{position:fixed;inset:0;z-index:9000;background:#111;display:flex;align-items:center;justify-content:center;padding:20px;font-family:'Segoe UI',Arial,sans-serif;color:#f0f0f0;overflow:auto}
.acct-gate .g{width:100%;max-width:420px;text-align:center}
.acct-gate h2{font-size:22px;margin:10px 0 8px}
.acct-gate p{font-size:14px;color:#9a9a9a;line-height:1.6;margin:0 0 16px}
.acct-gate .em{color:#fff;font-weight:700;word-break:break-all}
.acct-gate .home{display:inline-block;margin-top:14px;color:#e2aa3c;font-size:13px;text-decoration:none}
.acct-gate input{width:100%;box-sizing:border-box;background:#1a1a1a;border:1px solid #444;color:#f0f0f0;border-radius:8px;padding:11px 12px;font-size:15px;margin-bottom:10px;font-family:inherit}
`;

// Hide gated pages until access is confirmed (the page's own <style> does the same before this loads).
const hideCss = document.createElement('style');
hideCss.textContent = 'html[data-gate]:not(.gate-ok) body>*:not(.acct-gate):not(.acct-ov){display:none!important}';
document.head.appendChild(hideCss);
const allow = () => document.documentElement.classList.add('gate-ok');

let gateEl = null;
function showGateMessage(title, text) {
  if (!gated) return;
  if (!gateEl) { gateEl = document.createElement('div'); gateEl.className = 'acct-gate'; document.body.appendChild(gateEl); }
  gateEl.innerHTML = `<div class="g"><h2>${esc(title)}</h2><p>${esc(text)}</p><a class="home" href="fire.html">&larr; Back to the Study Hub</a></div>`;
}

if (!configured) { allow(); window.dispatchEvent(new CustomEvent('firehub-unconfigured')); }
else start().catch(err => {
  console.error('Fire hub failed to start', err);
  showGateMessage('Can\'t reach the sign-in service', 'Check your internet connection and refresh the page.');
});

async function start() {
  if (gated) showGateMessage('Loading...', 'Checking your access.');
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
  let access = { status: 'signedout' };

  // ---------- UI ----------
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const btn = document.createElement('button'); btn.className = 'acct-btn'; btn.type = 'button';
  btn.innerHTML = '<span class="acct-dot"></span><span class="acct-lbl">Sign in</span>';
  const nav = document.querySelector('.nav');
  if (nav) { const t = nav.querySelector('.nav-title'); t ? t.after(btn) : nav.prepend(btn); } else { btn.classList.add('acct-float'); (document.querySelector('header') || document.body).appendChild(btn); }

  const ov = document.createElement('div'); ov.className = 'acct-ov';
  ov.innerHTML = `<div class="acct-box" role="dialog" aria-modal="true"><button class="acct-x" aria-label="Close">&times;</button><div class="acct-view"></div></div>`;
  document.body.appendChild(ov);
  const view = ov.querySelector('.acct-view');
  const close = () => ov.classList.remove('open');
  ov.addEventListener('click', e => { if (e.target === ov || e.target.classList.contains('acct-x')) close(); });
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
    'auth/network-request-failed': 'No internet connection.',
    'permission-denied': 'You don\'t have permission to do that.'
  }[e.code] || ('Something went wrong: ' + (e.code || e.message)));

  const roleLabel = () => ({ admin: 'Site admin', chief: 'Fire chief' + (access.deptName ? ', ' + access.deptName : ''), member: access.deptName || 'Member' }[access.status] || '');

  function render(mode, extra) {
    if (mode === 'account') {
      const staff = access.status === 'admin' || access.status === 'chief';
      const inRoster = ['admin', 'chief', 'member'].includes(access.status);
      view.innerHTML = `<h3>Your account</h3><p class="s">Signed in as <b style="color:#fff">${esc(user.email || 'user')}</b>${roleLabel() ? '<br>' + esc(roleLabel()) : ''}</p>
        <div class="acct-msg ok">${sync && ready ? 'Progress is synced.' : ''}</div>
        ${inRoster ? '<a class="acct-main" href="account.html">My Account &amp; Certificates</a>' : ''}
        ${staff ? '<a class="acct-alt" href="admin.html" style="background:#e2aa3c;color:#111">Admin Dashboard</a>' : ''}
        <button class="acct-alt dark" data-a="out">Sign out</button>`;
    } else if (mode === 'reset') {
      view.innerHTML = `<h3>Reset password</h3><p class="s">We'll email you a link to set a new password.</p>
        <input type="email" placeholder="Email" autocomplete="email" class="f-email">
        <div class="acct-msg"></div><button class="acct-main" data-a="reset">Send reset link</button>
        <div class="acct-row"><a data-v="signin">Back to sign in</a></div>`;
    } else if (mode === 'flag') {
      const it = extra;
      view.innerHTML = `<h3>Flag this question</h3><p class="s">Think the question or answer is wrong? Say what looks off and it goes to the review list.</p>
        <div class="acct-q">${esc(it.q)}${it.answer ? `<br><br>App's answer: <b>${esc(it.answer)}</b>` : ''}</div>
        <textarea class="f-note" placeholder="What looks wrong? (optional) e.g. the book says the answer is..."></textarea>
        <div class="acct-msg"></div><button class="acct-main" data-a="flag">Send flag</button>`;
      view._flag = it;
    } else {
      const up = mode === 'signup';
      view.innerHTML = `<h3>${up ? 'Create an account' : 'Sign in'}</h3>
        <p class="s">The study guides are for invited members. Use the same email your fire chief added to the roster.</p>
        <input type="email" placeholder="Email" autocomplete="email" class="f-email">
        <input type="password" placeholder="Password${up ? ' (6+ characters)' : ''}" autocomplete="${up ? 'new-password' : 'current-password'}" class="f-pass">
        <div class="acct-msg"></div>
        <button class="acct-main" data-a="${up ? 'signup' : 'signin'}">${up ? 'Create account' : 'Sign in'}</button>
        <div class="acct-or">OR</div>
        <button class="acct-alt" data-a="google">Continue with Google</button>
        <div class="acct-row">${up ? '<a data-v="signin">I already have an account</a><span></span>' : '<a data-v="signup">Create an account</a><a data-v="reset">Forgot password?</a>'}</div>`;
    }
    view.querySelectorAll('[data-v]').forEach(a => a.onclick = () => render(a.dataset.v));
    view.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(b.dataset.a, b, view));
    view.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') view.querySelector('.acct-main').click(); }));
    const f = view.querySelector('input,textarea'); if (f) setTimeout(() => f.focus(), 50);
  }

  async function act(a, b, scope) {
    const msg = scope.querySelector('.acct-msg');
    const email = (scope.querySelector('.f-email') || {}).value?.trim();
    const pass = (scope.querySelector('.f-pass') || {}).value;
    const say = (t, ok) => { if (msg) { msg.textContent = t; msg.className = 'acct-msg ' + (ok ? 'ok' : 'err'); } };
    b.disabled = true;
    try {
      let isNew = false;
      if (a === 'signin') await A.signInWithEmailAndPassword(auth, email, pass);
      else if (a === 'signup') {
        const r = await A.createUserWithEmailAndPassword(auth, email, pass); isNew = true;
        try { await A.sendEmailVerification(r.user); } catch (e) { console.warn(e); }
      }
      else if (a === 'google') { const r = await A.signInWithPopup(auth, new A.GoogleAuthProvider()); isNew = !!A.getAdditionalUserInfo(r)?.isNewUser; }
      else if (a === 'reset') { await A.sendPasswordResetEmail(auth, email); say('Check your email for the reset link.', true); }
      else if (a === 'out') { await flush(); await A.signOut(auth); close(); }
      else if (a === 'flag') {
        const it = scope._flag, note = scope.querySelector('.f-note').value.trim();
        await F.addDoc(F.collection(db, 'flags'), {
          app: it.app || '', ch: it.ch || '', q: String(it.q || '').slice(0, 1500), answer: String(it.answer || '').slice(0, 500),
          note: note.slice(0, 1500), uid: user.uid, email: user.email || null, status: 'open', created: F.serverTimestamp()
        });
        say('Thanks! It\'s on the review list.', true); setTimeout(close, 1100);
      }
      if (a === 'signin' || a === 'signup' || a === 'google') {
        close();
        if (isNew && !/account\.html/.test(location.pathname)) window._fireWelcome = true;
      }
    } catch (e) { say(friendly(e)); }
    if (b.isConnected) b.disabled = false;
  }

  // ---------- Access (roles + invites) ----------
  const lower = s => String(s || '').toLowerCase();
  async function resolveAccess(u) {
    if (!u) return { status: 'signedout' };
    const email = lower(u.email);
    const passwordOnly = u.providerData.length > 0 && u.providerData.every(p => p.providerId === 'password');
    if (!u.emailVerified && passwordOnly) return { status: 'unverified' };
    if (admins.includes(email)) return { status: 'admin' };
    const roleSnap = await F.getDoc(F.doc(db, 'roles', u.uid));
    if (roleSnap.exists()) { const r = roleSnap.data(); return { status: r.role === 'chief' ? 'chief' : 'member', deptId: r.deptId, deptName: r.deptName }; }
    // Not on a roster yet: claim an invite if one exists for this email.
    let inv = null;
    try { inv = await F.getDoc(F.doc(db, 'invites', email)); } catch (e) { inv = null; }
    if (inv && inv.exists()) {
      const d = inv.data();
      await F.setDoc(F.doc(db, 'roles', u.uid), { role: d.role, deptId: d.deptId, deptName: d.deptName || '', email, joined: F.serverTimestamp() });
      return { status: d.role === 'chief' ? 'chief' : 'member', deptId: d.deptId, deptName: d.deptName };
    }
    return { status: 'none' };
  }

  function renderGate() {
    if (!gated) return;
    if (['admin', 'chief', 'member'].includes(access.status)) { allow(); if (gateEl) { gateEl.remove(); gateEl = null; } return; }
    document.documentElement.classList.remove('gate-ok');
    if (!gateEl) { gateEl = document.createElement('div'); gateEl.className = 'acct-gate'; document.body.appendChild(gateEl); }
    const home = '<a class="home" href="fire.html">&larr; Back to the Study Hub</a>';
    if (access.status === 'signedout') {
      gateEl.innerHTML = `<div class="g"><h2>Members only</h2><p>The FF I &amp; II and Hazmat study guides are for invited members. Sign in with the email your fire chief added to your department's roster.</p>
        <button class="acct-main" data-g="signin">Sign in or create an account</button>${home}</div>`;
    } else if (access.status === 'unverified') {
      gateEl.innerHTML = `<div class="g"><h2>Verify your email</h2><p>We sent a link to <span class="em">${esc(user.email)}</span>. Open it, then come back and tap the button below.</p>
        <div class="acct-msg"></div><button class="acct-main" data-g="verified">I've verified my email</button>
        <button class="acct-alt dark" data-g="resend">Resend the link</button><button class="acct-alt dark" data-g="out">Sign out</button>${home}</div>`;
    } else if (access.status === 'error') {
      gateEl.innerHTML = `<div class="g"><h2>Couldn't check your access</h2><p>${esc(access.msg || 'Try again in a minute.')}</p><div class="acct-msg"></div><button class="acct-main" data-g="retry">Try again</button><button class="acct-alt dark" data-g="out">Sign out</button>${home}</div>`;
    } else {
      gateEl.innerHTML = `<div class="g"><h2>You're not on a roster yet</h2><p>Signed in as <span class="em">${esc(user.email)}</span>. Ask your fire chief to add this exact email to your department, then tap <b>Check again</b>. Or send a request to the site admin:</p>
        <input class="f-rname" placeholder="Your name"><input class="f-rdept" placeholder="Your fire department">
        <div class="acct-msg"></div><button class="acct-main" data-g="request">Request access</button>
        <button class="acct-alt dark" data-g="retry">Check again</button><button class="acct-alt dark" data-g="out">Sign out</button>${home}</div>`;
    }
    gateEl.querySelectorAll('[data-g]').forEach(b => b.onclick = () => gateAct(b.dataset.g, b));
  }

  async function gateAct(g, b) {
    const say = (t, ok) => { const m = gateEl && gateEl.querySelector('.acct-msg'); if (m) { m.textContent = t; m.className = 'acct-msg ' + (ok ? 'ok' : 'err'); } };
    b.disabled = true;
    try {
      if (g === 'signin') { render('signin'); ov.classList.add('open'); }
      else if (g === 'out') { await A.signOut(auth); }
      else if (g === 'resend') { await A.sendEmailVerification(user); say('Sent. Check your inbox and spam folder.', true); }
      else if (g === 'verified' || g === 'retry') {
        await user.reload(); await user.getIdToken(true);
        await refreshAccess(auth.currentUser);
        if (access.status === 'unverified') say('Not verified yet. Open the link in the email first.');
        else if (access.status === 'none' && g === 'retry') say('Still not on a roster.');
        else if (['member', 'chief', 'admin'].includes(access.status) && sync) await pull();
      }
      else if (g === 'request') {
        const name = gateEl.querySelector('.f-rname').value.trim(), dept = gateEl.querySelector('.f-rdept').value.trim();
        if (!name || !dept) { say('Enter your name and department.'); b.disabled = false; return; }
        await F.setDoc(F.doc(db, 'accessRequests', user.uid), { name, dept, email: lower(user.email), created: F.serverTimestamp() });
        say('Request sent. You\'ll get in once you\'re added to a roster.', true);
      }
    } catch (e) { say(friendly(e)); }
    if (b.isConnected) b.disabled = false;
  }

  async function refreshAccess(u) {
    try { access = await resolveAccess(u); }
    catch (e) { console.error(e); access = { status: 'error', msg: friendly(e) }; }
    window.fireHub.access = access;
    btn.classList.toggle('in', !!u);
    btn.querySelector('.acct-lbl').textContent = u ? (access.status === 'admin' || access.status === 'chief' ? 'Admin' : (sync ? 'Saved' : 'Account')) : 'Sign in';
    renderGate();
    window.dispatchEvent(new CustomEvent('firehub-access', { detail: access }));
    if (window._fireWelcome && ['member', 'chief', 'admin'].includes(access.status)) { window._fireWelcome = false; setTimeout(() => location.href = 'account.html?welcome=1', 400); }
  }

  // ---------- Progress sync ----------
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
    try { await F.setDoc(docRef(), { data: JSON.parse(JSON.stringify(data ?? sync.get())), updated: F.serverTimestamp(), email: user.email || null }); }
    catch (e) { console.warn('Cloud save failed', e); }
  }
  async function flush() { if (timer) { clearTimeout(timer); timer = null; await push(); } }
  window.cloudChanged = () => {
    if (!user || !sync || !ready) return;
    clearTimeout(timer); timer = setTimeout(() => { timer = null; push(); }, 1200);
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  window.cloudLog = async (entry) => {
    if (!user || !['member', 'chief', 'admin'].includes(access.status)) return;
    try {
      await F.setDoc(F.doc(db, 'users', user.uid, 'progress', 'activity'),
        { last: Date.now(), quizzes: F.arrayUnion({ ...JSON.parse(JSON.stringify(entry)), date: Date.now() }) }, { merge: true });
    } catch (e) { console.warn('Quiz log failed', e); }
  };
  window.fireFlag = (item) => {
    if (!user) { render('signin'); ov.classList.add('open'); return; }
    render('flag', item); ov.classList.add('open');
  };

  // Shared handle for account.html and admin.html.
  window.fireHub = { A, F, auth, db, admins, access, user: () => user, openSignIn: (mode) => { render(mode || 'signin'); ov.classList.add('open'); } };

  A.onAuthStateChanged(auth, async u => {
    user = u;
    await refreshAccess(u);
    if (u && sync && ['member', 'chief', 'admin'].includes(access.status)) await pull();
    window.dispatchEvent(new CustomEvent('firehub-user', { detail: u }));
  });
  window.dispatchEvent(new CustomEvent('firehub-ready'));
}

function esc(s) { return String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
