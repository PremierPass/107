import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, runTransaction, deleteDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

let env;
const projectId='demo-premierpass-fire';
const classA='ff-a', classB='ff-b';
const email='student@example.com';
const memberId=(id,mail=email)=>id+'__'+mail;
const auth=(uid,mail,verified=true)=>env.authenticatedContext(uid,{email:mail,email_verified:verified}).firestore();
const student=()=>auth('student-1',email);
const instructor=()=>auth('instructor-1','instructor@example.com');
const outsider=()=>auth('outsider-1','outsider@example.com');
const cls=(db,id)=>doc(db,'classes',id);
const member=(db,id,mail=email)=>doc(db,'classMembers',memberId(id,mail));
const baseClass=(name,capacity=2)=>({name,instructors:['instructor@example.com'],capacity,enrollmentCount:0,inviteEnabled:true,inviteCode:'test-code-123',blockedEmails:[]});
before(async()=>{env=await initializeTestEnvironment({projectId,firestore:{rules:readFileSync('firestore.rules','utf8')}});});
beforeEach(async()=>{
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async context=>{
  const db=context.firestore();
  await setDoc(cls(db,classA),baseClass('FF A'));
  await setDoc(cls(db,classB),baseClass('FF B'));
 });
});
after(async()=>{await env?.cleanup();});

async function join(db,id=classA,mail=email,code='test-code-123'){
 return runTransaction(db,async tx=>{
  const c=await tx.get(cls(db,id)),m=await tx.get(member(db,id,mail));
  if(m.exists())return 'already';
  const data=c.data();
  if(!data.inviteEnabled||data.inviteCode!==code)throw Error('Invalid invite');
  if(data.enrollmentCount>=data.capacity)throw Error('Full');
  tx.update(cls(db,id),{enrollmentCount:data.enrollmentCount+1});
  tx.set(member(db,id,mail),{classId:id,className:data.name,email:mail,uid:'student-1',name:'Test Student',dept:'Test VFD',status:'approved',inviteCode:code,addedBy:'invitation-link'});
  return 'joined';
 });
}
test('verified invitee enrolls with an atomic seat reservation',async()=>{
 await assertSucceeds(join(student()));
 const d=await assertSucceeds(getDoc(member(student(),classA)));
 assert.equal(d.data().dept,'Test VFD');
});
test('unverified invitee cannot enroll',async()=>{await assertFails(join(auth('student-1',email,false)));});
test('outsider cannot change class capacity',async()=>{await assertFails(updateDoc(cls(outsider(),classA),{capacity:400}));});
test('instructor can adjust seats but cannot forge enrollment count',async()=>{
 await assertSucceeds(updateDoc(cls(instructor(),classA),{capacity:10}));
 await assertFails(updateDoc(cls(instructor(),classA),{enrollmentCount:999}));
});
test('student cannot grant themselves instructor access',async()=>{await assertFails(updateDoc(cls(student(),classA),{instructors:['student@example.com']}));});
test('invalid invite code is rejected by Firestore rules',async()=>{
 const db=student();
 await assertFails(runTransaction(db,async tx=>{
  const c=await tx.get(cls(db,classA));
  tx.update(cls(db,classA),{enrollmentCount:c.data().enrollmentCount+1});
  tx.set(member(db,classA),{classId:classA,className:'FF A',email,uid:'student-1',status:'approved',inviteCode:'wrong-code',addedBy:'invitation-link'});
 }));
});
test('full class rejects additional enrollment',async()=>{
 await env.withSecurityRulesDisabled(async context=>{await updateDoc(cls(context.firestore(),classA),{capacity:1,enrollmentCount:1});});
 await assert.rejects(join(student()),/Full/);
});
test('blocked student cannot rejoin',async()=>{
 await env.withSecurityRulesDisabled(async context=>{await updateDoc(cls(context.firestore(),classA),{blockedEmails:[email]});});
 await assertFails(join(student()));
});
test('student cannot edit their enrollment status',async()=>{
 await assertSucceeds(join(student()));
 await assertFails(updateDoc(member(student(),classA),{status:'instructor'}));
});
test('student cannot delete their enrollment',async()=>{
 await assertSucceeds(join(student()));
 await assertFails(deleteDoc(member(student(),classA)));
});
test('another student cannot read this enrollment',async()=>{
 await assertSucceeds(join(student()));
 await assertFails(getDoc(member(outsider(),classA)));
});
test('instructor cannot move students to an unauthorized class',async()=>{
 await assertSucceeds(join(student()));
 await env.withSecurityRulesDisabled(async context=>{await updateDoc(cls(context.firestore(),classB),{instructors:['other-instructor@example.com']});});
 const db=instructor();
 await assertFails(runTransaction(db,async tx=>{
  const a=await tx.get(cls(db,classA)),b=await tx.get(cls(db,classB)),m=await tx.get(member(db,classA));
  tx.update(cls(db,classA),{enrollmentCount:a.data().enrollmentCount-1});
  tx.update(cls(db,classB),{enrollmentCount:b.data().enrollmentCount+1});
  tx.set(member(db,classB),{...m.data(),classId:classB,className:'FF B'});
  tx.delete(member(db,classA));
 }));
});

test('instructor removal updates seat count atomically',async()=>{
 await assertSucceeds(join(student()));
 const db=instructor();
 await assertSucceeds(runTransaction(db,async tx=>{
  const c=await tx.get(cls(db,classA)),m=await tx.get(member(db,classA));
  assert.ok(m.exists());
  tx.delete(member(db,classA));
  tx.update(cls(db,classA),{enrollmentCount:c.data().enrollmentCount-1});
 }));
 const c=await getDoc(cls(db,classA));
 assert.equal(c.data().enrollmentCount,0);
});
test('instructor transfer preserves progress and both seat counts',async()=>{
 await assertSucceeds(join(student()));
 await env.withSecurityRulesDisabled(async ctx=>{
  await updateDoc(member(ctx.firestore(),classA),{quizzes:7,qScore:85,byCh:{ch01:85}});
 });
 const db=instructor();
 await assertSucceeds(runTransaction(db,async tx=>{
  const a=await tx.get(cls(db,classA)),b=await tx.get(cls(db,classB)),m=await tx.get(member(db,classA));
  assert.ok(m.exists());
  tx.update(cls(db,classA),{enrollmentCount:a.data().enrollmentCount-1});
  tx.update(cls(db,classB),{enrollmentCount:b.data().enrollmentCount+1});
  tx.set(member(db,classB),{...m.data(),classId:classB,className:b.data().name});
  tx.delete(member(db,classA));
 }));
 const moved=await getDoc(member(db,classB));
 assert.equal(moved.data().quizzes,7);
 assert.equal(moved.data().qScore,85);
 assert.deepEqual(moved.data().byCh,{ch01:85});
 assert.equal((await getDoc(cls(db,classA))).data().enrollmentCount,0);
 assert.equal((await getDoc(cls(db,classB))).data().enrollmentCount,1);
});
test('instructor cannot overfill destination class during transfer',async()=>{
 await assertSucceeds(join(student()));
 await env.withSecurityRulesDisabled(async ctx=>{
  await updateDoc(cls(ctx.firestore(),classB),{capacity:1,enrollmentCount:1});
 });
 const db=instructor();
 await assertFails(runTransaction(db,async tx=>{
  const a=await tx.get(cls(db,classA)),b=await tx.get(cls(db,classB)),m=await tx.get(member(db,classA));
  tx.update(cls(db,classA),{enrollmentCount:a.data().enrollmentCount-1});
  tx.update(cls(db,classB),{enrollmentCount:b.data().enrollmentCount+1});
  tx.set(member(db,classB),{...m.data(),classId:classB,className:b.data().name});
  tx.delete(member(db,classA));
 }));
});
