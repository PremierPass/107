// Part 107 Study Hub: student accounts and cloud save (Firebase Auth + Firestore, free Spark plan).
// Separate from the Fire Study Hub roster: any student can create an account.
//
// Data written:
//   users/{uid}/p107/progress  -> known cards, review cards, missed questions, test history (the student only)
//   p107Students/{uid}         -> name, class period, email, test summary (the student and the teacher/admin)
//
// The page listens for:  window.addEventListener('p107-auth', e => e.detail = {user, profile})
// The page calls:        window.P107.signIn(email, pass) / signUp / google() / reset(email) / signOut()
//                        window.P107.saveProfile({name, period})
//                        window.P107.loadProgress() / saveProgress(data) / logTest(result) / flag(info)
import { firebaseConfig, ADMIN_EMAILS } from './firebase-config.js?v=4';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const admins = (ADMIN_EMAILS || []).map(e => e.toLowerCase());
const api = { user: null, profile: null, isTeacher: false };
window.P107 = api;
const emit = () => window.dispatchEvent(new CustomEvent('p107-auth', { detail: { user: api.user, profile: api.profile, isTeacher: api.isTeacher } }));
const nice = e => {
  const c = (e && e.code) || '';
  return ({
    'auth/invalid-credential': 'That email and password do not match.',
    'auth/wrong-password': 'That email and password do not match.',
    'auth/user-not-found': 'No account uses that email. Create one below.',
    'auth/email-already-in-use': 'An account already uses that email. Sign in instead.',
    'auth/weak-password': 'Use a password with at least 6 characters.',
    'auth/invalid-email': 'Check the email address.',
    'auth/popup-closed-by-user': 'The Google window was closed before finishing.',
    'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups and try again.',
    'auth/network-request-failed': 'No internet connection. Check your connection and try again.',
    'auth/too-many-requests': 'Too many tries. Wait a minute and try again.'
  })[c] || 'Something went wrong. Please try again.';
};

start().catch(err => {
  console.error('Part 107 cloud failed to start', err);
  window.dispatchEvent(new CustomEvent('p107-offline'));
});

async function start() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app), db = F.getFirestore(app);
  const progRef = uid => F.doc(db, 'users', uid, 'p107', 'progress');
  const stuRef = uid => F.doc(db, 'p107Students', uid);

  const wrap = fn => async (...a) => { try { await fn(...a); return { ok: true }; } catch (e) { console.warn(e); return { ok: false, msg: nice(e) }; } };
  api.signIn = wrap((email, pass) => A.signInWithEmailAndPassword(auth, email, pass));
  api.signUp = wrap(async (email, pass) => { const r = await A.createUserWithEmailAndPassword(auth, email, pass); try { await A.sendEmailVerification(r.user); } catch (e) {} });
  api.google = wrap(() => A.signInWithPopup(auth, new A.GoogleAuthProvider()));
  api.reset = wrap(email => A.sendPasswordResetEmail(auth, email));
  api.signOut = wrap(async () => { await flush(); await A.signOut(auth); });

  api.saveProfile = wrap(async ({ name, period }) => {
    const u = auth.currentUser; if (!u) throw { code: 'no-user' };
    const data = { name: String(name).trim().slice(0, 80), period: String(period).trim().slice(0, 60), email: (u.email || '').toLowerCase(), updated: F.serverTimestamp() };
    if (!api.profile) data.created = F.serverTimestamp();
    await F.setDoc(stuRef(u.uid), data, { merge: true });
    api.profile = { ...(api.profile || {}), ...data };
    emit();
  });

  api.loadProgress = async () => {
    const u = auth.currentUser; if (!u) return null;
    try { const s = await F.getDoc(progRef(u.uid)); return s.exists() ? s.data() : null; } catch (e) { console.warn(e); return null; }
  };

  let pending = null, timer = null;
  async function flush() {
    clearTimeout(timer); timer = null;
    const u = auth.currentUser; if (!u || !pending) return;
    const data = pending; pending = null;
    try { await F.setDoc(progRef(u.uid), { ...data, updated: F.serverTimestamp() }); } catch (e) { console.warn('save failed', e); pending = pending || data; }
  }
  api.saveProgress = data => { pending = data; clearTimeout(timer); timer = setTimeout(flush, 1500); };
  api.flush = flush;
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  // result = {score, total, pct, byArea:{regs:[right,total],...}, mins}
  api.logTest = async (result, history) => {
    const u = auth.currentUser; if (!u) return;
    const tests = (history || []).slice(-50);
    const best = tests.reduce((m, t) => Math.max(m, t.pct || 0), 0);
    try {
      await F.setDoc(stuRef(u.uid), {
        email: (u.email || '').toLowerCase(), tests: tests.length, best, last: result.pct, lastByArea: result.byArea,
        lastTest: F.serverTimestamp(), history: tests.map(t => ({ pct: t.pct, at: t.at }))
      }, { merge: true });
    } catch (e) { console.warn(e); }
  };
  api.touch = async summary => {
    const u = auth.currentUser; if (!u || !api.profile) return;
    try { await F.setDoc(stuRef(u.uid), { ...summary, active: F.serverTimestamp() }, { merge: true }); } catch (e) { console.warn(e); }
  };

  // Flag a question for the teacher (goes to the shared flags list on the admin dashboard).
  api.flag = wrap(async info => {
    const u = auth.currentUser; if (!u) throw { code: 'no-user' };
    await F.addDoc(F.collection(db, 'flags'), {
      app: 'p107', ch: info.ch || '', q: info.q, answer: info.answer || '', note: String(info.note || '').slice(0, 1000),
      uid: u.uid, email: (u.email || '').toLowerCase(), name: (api.profile && api.profile.name) || '',
      status: 'open', created: F.serverTimestamp()
    });
  });

  // Teacher tools (admin only, enforced by Firestore rules).
  api.listStudents = async () => {
    const s = await F.getDocs(F.collection(db, 'p107Students'));
    const out = []; s.forEach(d => out.push({ uid: d.id, ...d.data() })); return out;
  };

  A.onAuthStateChanged(auth, async user => {
    api.user = user || null; api.profile = null;
    api.isTeacher = !!(user && user.email && admins.includes(user.email.toLowerCase()));
    if (user) {
      try { const s = await F.getDoc(stuRef(user.uid)); if (s.exists() && s.data().name) api.profile = s.data(); } catch (e) { console.warn(e); }
    }
    emit();
  });
}
