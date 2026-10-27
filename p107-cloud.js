// Part 107 Study Hub: accounts, classes, and cloud save (Firebase Auth + Firestore, free Spark plan).
// Anyone can create a free personal account. Teachers (added by the site admin) create their own classes
// and add students by email. Each teacher sees only their own classes and students.
//
// Data:
//   users/{uid}/p107/progress          -> the student's cards, misses, and test history (student only)
//   p107Students/{uid}                 -> name, email, classes, teachers[], score summary (student, their teachers, admin)
//   p107Teachers/{email}               -> teachers the admin has approved
//   p107Classes/{classId}              -> a class: name, teacherEmail, teacherName
//   p107Roster/{classId}__{email}      -> a student added to a class
//
// Page events:  'p107-auth' detail = {user, profile, isTeacher, isAdmin, classes}
import { firebaseConfig, ADMIN_EMAILS } from './firebase-config.js?v=5';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const admins = (ADMIN_EMAILS || []).map(e => e.toLowerCase());
const api = { user: null, profile: null, isTeacher: false, isAdmin: false, classes: [], teacher: null };
window.P107 = api;
const emit = () => window.dispatchEvent(new CustomEvent('p107-auth', { detail: { user: api.user, profile: api.profile, isTeacher: api.isTeacher, isAdmin: api.isAdmin, classes: api.classes } }));
const low = s => String(s || '').trim().toLowerCase();
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
    'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
    'permission-denied': 'You do not have permission to do that. Make sure the latest Firestore rules are published.',
    'need-name': 'Enter a class name.'
  })[c] || (e && e.message && !c ? e.message : 'Something went wrong. Please try again.');
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
  const tchRef = email => F.doc(db, 'p107Teachers', low(email));
  const clsRef = id => F.doc(db, 'p107Classes', id);
  const rosRef = (classId, email) => F.doc(db, 'p107Roster', classId + '__' + low(email));
  const me = () => low(auth.currentUser && auth.currentUser.email);
  const docs = s => { const out = []; s.forEach(d => out.push({ id: d.id, ...d.data() })); return out; };
  const q = (col, ...w) => F.getDocs(w.length ? F.query(F.collection(db, col), ...w) : F.collection(db, col)).then(docs);

  const wrap = fn => async (...a) => { try { const v = await fn(...a); return { ok: true, value: v }; } catch (e) { console.warn(e); return { ok: false, msg: nice(e) }; } };
  api.signIn = wrap((email, pass) => A.signInWithEmailAndPassword(auth, email, pass));
  api.signUp = wrap(async (email, pass) => { const r = await A.createUserWithEmailAndPassword(auth, email, pass); try { await A.sendEmailVerification(r.user); } catch (e) {} });
  api.google = wrap(() => A.signInWithPopup(auth, new A.GoogleAuthProvider()));
  api.reset = wrap(email => A.sendPasswordResetEmail(auth, email));
  api.signOut = wrap(async () => { await flush(); await A.signOut(auth); });

  api.saveProfile = wrap(async ({ name }) => {
    const u = auth.currentUser; if (!u) throw { code: 'no-user' };
    const data = { name: String(name).trim().slice(0, 80), email: me(), updated: F.serverTimestamp() };
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

  api.logTest = async (result, history) => {
    const u = auth.currentUser; if (!u) return;
    const tests = (history || []).slice(-50);
    const best = tests.reduce((m, t) => Math.max(m, t.pct || 0), 0);
    try {
      await F.setDoc(stuRef(u.uid), { email: me(), tests: tests.length, best, last: result.pct, lastByArea: result.byArea,
        lastTest: F.serverTimestamp(), history: tests.map(t => ({ pct: t.pct, at: t.at })) }, { merge: true });
    } catch (e) { console.warn(e); }
  };
  api.touch = async summary => {
    const u = auth.currentUser; if (!u || !api.profile) return;
    try { await F.setDoc(stuRef(u.uid), { ...summary, active: F.serverTimestamp() }, { merge: true }); } catch (e) { console.warn(e); }
  };

  api.flag = wrap(async info => {
    const u = auth.currentUser; if (!u) throw { code: 'no-user' };
    await F.addDoc(F.collection(db, 'flags'), {
      app: 'p107', ch: info.ch || '', q: info.q, answer: info.answer || '', note: String(info.note || '').slice(0, 1000),
      uid: u.uid, email: me(), name: (api.profile && api.profile.name) || '', status: 'open', created: F.serverTimestamp()
    });
  });

  // ---------- Admin: teachers ----------
  api.listTeachers = () => q('p107Teachers');
  api.addTeacher = wrap(async ({ email, name, school }) => {
    const e = low(email); if (!/^\S+@\S+\.\S+$/.test(e)) throw { code: 'auth/invalid-email' };
    await F.setDoc(tchRef(e), { email: e, name: String(name || '').trim().slice(0, 80), school: String(school || '').trim().slice(0, 80), added: F.serverTimestamp() }, { merge: true });
  });
  api.removeTeacher = wrap(async email => { await F.deleteDoc(tchRef(email)); });

  // ---------- Classes (each teacher sees only their own; the admin sees all) ----------
  api.listClasses = () => api.isAdmin ? q('p107Classes') : q('p107Classes', F.where('teacherEmail', '==', me()));
  api.createClass = wrap(async ({ name, teacherEmail, teacherName }) => {
    const n = String(name || '').trim().slice(0, 80); if (!n) throw { code: 'need-name' };
    const t = api.isAdmin && teacherEmail ? low(teacherEmail) : me();
    const tn = teacherName || (t === me() ? ((api.teacher && api.teacher.name) || (api.profile && api.profile.name) || '') : '');
    const id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await F.setDoc(clsRef(id), { name: n, teacherEmail: t, teacherName: tn, created: F.serverTimestamp() });
    return id;
  });
  api.renameClass = wrap(async (id, name) => { await F.updateDoc(clsRef(id), { name: String(name).trim().slice(0, 80) }); });
  api.deleteClass = wrap(async id => {
    const ros = api.isAdmin ? await q('p107Roster', F.where('classId', '==', id)) : await q('p107Roster', F.where('classId', '==', id), F.where('teacherEmail', '==', me()));
    for (const r of ros) await F.deleteDoc(F.doc(db, 'p107Roster', r.id));
    await F.deleteDoc(clsRef(id));
  });

  // ---------- Roster ----------
  api.listRoster = () => api.isAdmin ? q('p107Roster') : q('p107Roster', F.where('teacherEmail', '==', me()));
  api.addStudent = wrap(async ({ cls, email, name }) => {
    const e = low(email); if (!/^\S+@\S+\.\S+$/.test(e)) throw { code: 'auth/invalid-email' };
    await F.setDoc(rosRef(cls.id, e), { classId: cls.id, className: cls.name, teacherEmail: cls.teacherEmail, teacherName: cls.teacherName || '',
      email: e, name: String(name || '').trim().slice(0, 80), added: F.serverTimestamp() }, { merge: true });
  });
  api.removeStudent = wrap(async rosterId => { await F.deleteDoc(F.doc(db, 'p107Roster', rosterId)); });
  api.listStudents = () => api.isAdmin ? q('p107Students') : q('p107Students', F.where('teachers', 'array-contains', me()));

  A.onAuthStateChanged(auth, async user => {
    api.user = user || null; api.profile = null; api.classes = []; api.teacher = null;
    const email = low(user && user.email);
    api.isAdmin = !!(user && admins.includes(email));
    api.isTeacher = api.isAdmin;
    if (user) {
      try { const s = await F.getDoc(stuRef(user.uid)); if (s.exists() && s.data().name) api.profile = s.data(); } catch (e) { console.warn(e); }
      if (email && user.emailVerified) {
        try { const t = await F.getDoc(tchRef(email)); if (t.exists()) { api.teacher = t.data(); api.isTeacher = true; } } catch (e) {}
        // Which classes has a teacher added this person to? (Readable only with a verified email.)
        let ros = [];
        try { ros = await q('p107Roster', F.where('email', '==', email)); } catch (e) { console.warn(e); }
        api.classes = ros.map(r => ({ id: r.classId, name: r.className || '', teacher: r.teacherName || '', teacherEmail: r.teacherEmail }));
        const teachers = [...new Set(ros.map(r => low(r.teacherEmail)).filter(Boolean))];
        const p = api.profile || {};
        const nameFromRoster = (ros.find(r => r.name) || {}).name || '';
        const same = JSON.stringify(p.teachers || []) === JSON.stringify(teachers) && JSON.stringify((p.classes || []).map(c => c.id)) === JSON.stringify(api.classes.map(c => c.id));
        if (!same || (!p.name && nameFromRoster && ros.length)) {
          const want = { email, teachers, classes: api.classes, student: teachers.length > 0 };
          if (!p.name && nameFromRoster && ros.length) want.name = nameFromRoster;
          if (!api.profile && want.name) want.created = F.serverTimestamp();
          try { await F.setDoc(stuRef(user.uid), want, { merge: true }); if (api.profile || want.name) api.profile = { ...p, ...want }; } catch (e) { console.warn(e); }
        }
      }
    }
    emit();
  });
}
