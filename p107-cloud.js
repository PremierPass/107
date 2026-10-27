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
const emit = () => window.dispatchEvent(new CustomEvent('p107-auth', { detail: { user: api.user, profile: api.profile, isTeacher: api.isTeacher, isAdmin: api.isAdmin, classes: api.classes, teacher: api.teacher } }));
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
  // Teacher sign-up requests: p107TeacherRequests/{email}. A verified user asks; the admin approves or declines.
  const reqRef = email => F.doc(db, 'p107TeacherRequests', low(email));
  api.requestTeacher = wrap(async ({ name, school }) => {
    const u = auth.currentUser; if (!u) throw { code: 'no-user' };
    if (!u.emailVerified) throw { message: 'Verify your email first (check your inbox for the link), then refresh and try again.' };
    if (!String(name || '').trim() || !String(school || '').trim()) throw { message: 'Enter your name and school.' };
    await F.setDoc(reqRef(me()), { email: me(), uid: u.uid, name: String(name).trim().slice(0, 80), school: String(school).trim().slice(0, 80), status: 'pending', created: F.serverTimestamp() });
  });
  api.myTeacherRequest = async () => { const u = auth.currentUser; if (!u || !u.emailVerified) return null; try { const d = await F.getDoc(reqRef(me())); return d.exists() ? d.data() : null; } catch (e) { return null; } };
  api.cancelTeacherRequest = wrap(async () => { await F.deleteDoc(reqRef(me())); });
  api.listTeacherRequests = () => q('p107TeacherRequests');
  api.approveTeacher = wrap(async rq => {
    await F.setDoc(tchRef(rq.email), { email: low(rq.email), name: rq.name || '', school: rq.school || '', added: F.serverTimestamp() }, { merge: true });
    await F.deleteDoc(reqRef(rq.email));
  });
  api.declineTeacher = wrap(async email => { await F.deleteDoc(reqRef(email)); });

  // ---------- Classes (each class can have several teachers; teachers see only classes they teach) ----------
  const tlist = c => (c.teacherList && c.teacherList.length) ? c.teacherList : [{ email: c.teacherEmail, name: c.teacherName || '' }];
  const temails = c => (c.teachers && c.teachers.length) ? c.teachers : [c.teacherEmail].filter(Boolean);
  const joinNames = l => { const n = l.map(t => t.name || t.email); return n.length <= 2 ? n.join(' & ') : n.slice(0, -1).join(', ') + ' & ' + n[n.length - 1]; };
  const merge = (...lists) => { const m = {}; lists.flat().forEach(x => m[x.id] = x); return Object.values(m); };
  api.listClasses = async () => api.isAdmin ? q('p107Classes')
    : merge(await q('p107Classes', F.where('teachers', 'array-contains', me())), await q('p107Classes', F.where('teacherEmail', '==', me())));
  api.createClass = wrap(async ({ name }) => {
    const n = String(name || '').trim().slice(0, 80); if (!n) throw { code: 'need-name' };
    const tn = (api.teacher && api.teacher.name) || (api.profile && api.profile.name) || '';
    const id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await F.setDoc(clsRef(id), { name: n, teacherEmail: me(), teachers: [me()], teacherList: [{ email: me(), name: tn }], teacherName: tn,
      teacherSchool: (api.teacher && api.teacher.school) || '', created: F.serverTimestamp() });
    return id;
  });
  api.renameClass = wrap(async (id, name) => { await F.updateDoc(clsRef(id), { name: String(name).trim().slice(0, 80) }); });
  const classRoster = id => api.isAdmin ? q('p107Roster', F.where('classId', '==', id))
    : Promise.all([q('p107Roster', F.where('classId', '==', id), F.where('teachers', 'array-contains', me())),
                   q('p107Roster', F.where('classId', '==', id), F.where('teacherEmail', '==', me()))]).then(r => merge(...r));
  api.deleteClass = wrap(async id => {
    for (const r of await classRoster(id)) await F.deleteDoc(F.doc(db, 'p107Roster', r.id));
    await F.deleteDoc(clsRef(id));
  });
  // Co-teachers: any teacher of a class can add or remove another approved teacher.
  async function saveTeachers(cls, list) {
    const teachers = list.map(t => low(t.email));
    const upd = { teachers, teacherList: list, teacherName: joinNames(list) };
    await F.updateDoc(clsRef(cls.id), upd);
    for (const r of await classRoster(cls.id)) await F.updateDoc(F.doc(db, 'p107Roster', r.id), { teachers, teacherName: upd.teacherName });
    Object.assign(cls, upd);
  }
  api.addCoTeacher = wrap(async (cls, email) => {
    const e = low(email); if (!/^\S+@\S+\.\S+$/.test(e)) throw { code: 'auth/invalid-email' };
    const d = await F.getDoc(tchRef(e));
    if (!d.exists()) throw { message: e + ' is not an approved teacher yet. They can request a teacher account on the Home tab.' };
    const list = tlist(cls).filter(t => low(t.email) !== e).concat([{ email: e, name: d.data().name || '' }]);
    await saveTeachers(cls, list);
  });
  api.removeCoTeacher = wrap(async (cls, email) => {
    const list = tlist(cls).filter(t => low(t.email) !== low(email));
    if (!list.length) throw { message: 'A class needs at least one teacher.' };
    await saveTeachers(cls, list);
  });
  api.classTeachers = tlist;

  // ---------- Roster ----------
  api.listRoster = async () => api.isAdmin ? q('p107Roster')
    : merge(await q('p107Roster', F.where('teachers', 'array-contains', me())), await q('p107Roster', F.where('teacherEmail', '==', me())));
  api.addStudent = wrap(async ({ cls, email, name }) => {
    const e = low(email); if (!/^\S+@\S+\.\S+$/.test(e)) throw { code: 'auth/invalid-email' };
    await F.setDoc(rosRef(cls.id, e), { classId: cls.id, className: cls.name, teacherEmail: cls.teacherEmail, teachers: temails(cls),
      teacherName: cls.teacherName || '', teacherSchool: cls.teacherSchool || '', email: e, name: String(name || '').trim().slice(0, 80), added: F.serverTimestamp() }, { merge: true });
  });
  api.removeStudent = wrap(async rosterId => { await F.deleteDoc(F.doc(db, 'p107Roster', rosterId)); });
  // Keep classes current: teacher list, this teacher's name, and the school students see.
  api.syncMyClasses = async (list, roster) => {
    const t = api.teacher;
    for (const c of list || []) {
      if (!temails(c).includes(me())) continue;
      const tl = tlist(c).map(x => low(x.email) === me() && t && t.name ? { email: x.email, name: t.name } : x);
      const upd = {};
      if (!c.teachers || !c.teachers.length) upd.teachers = tl.map(x => low(x.email));
      if (JSON.stringify(tl) !== JSON.stringify(c.teacherList || [])) { upd.teacherList = tl; upd.teacherName = joinNames(tl); }
      if (t && c.teacherEmail === me() && (t.school || '') !== (c.teacherSchool || '')) upd.teacherSchool = t.school || '';
      if (Object.keys(upd).length) { try { await F.updateDoc(clsRef(c.id), upd); Object.assign(c, upd); } catch (e) { console.warn(e); } }
      for (const r of (roster || []).filter(r => r.classId === c.id)) {
        const want = temails(c);
        if (JSON.stringify(r.teachers || []) !== JSON.stringify(want) || (r.teacherName || '') !== (c.teacherName || '') || (r.teacherSchool || '') !== (c.teacherSchool || '')) {
          try { await F.updateDoc(F.doc(db, 'p107Roster', r.id), { teachers: want, teacherName: c.teacherName || '', teacherSchool: c.teacherSchool || '' }); Object.assign(r, { teachers: want }); } catch (e) { console.warn(e); }
        }
      }
    }
  };
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
        // The site admin is also a teacher; give them a teacher profile the first time.
        if (api.isAdmin && !api.teacher) {
          const t = { email, name: 'Mr. Steward', school: 'Premier High School, Texarkana', added: F.serverTimestamp() };
          try { await F.setDoc(tchRef(email), t); api.teacher = t; } catch (e) { console.warn(e); }
        }
        // Which classes has a teacher added this person to? (Readable only with a verified email.)
        let ros = [];
        try { ros = await q('p107Roster', F.where('email', '==', email)); } catch (e) { console.warn(e); }
        api.classes = ros.map(r => ({ id: r.classId, name: r.className || '', teacher: r.teacherName || '', school: r.teacherSchool || '', teacherEmail: r.teacherEmail }));
        // Use the class's current name, teacher name, and school.
        await Promise.all(api.classes.map(async c => { try { const d = await F.getDoc(clsRef(c.id)); if (d.exists()) { const v = d.data(); c.name = v.name || c.name; c.teacher = v.teacherName || c.teacher; c.school = v.teacherSchool || c.school; } } catch (e) {} }));
        const teachers = [...new Set(ros.flatMap(r => (r.teachers && r.teachers.length) ? r.teachers : [r.teacherEmail]).map(low).filter(Boolean))].sort();
        const p = api.profile || {};
        const nameFromRoster = (ros.find(r => r.name) || {}).name || '';
        const same = JSON.stringify([...(p.teachers || [])].sort()) === JSON.stringify(teachers) && JSON.stringify((p.classes || []).map(c => c.id)) === JSON.stringify(api.classes.map(c => c.id));
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
