# Fire class enrollment: safe testing

This feature is a **draft**, not ready to merge or deploy. These tests target the Firebase **Firestore emulator** and use a fake `demo-` project ID. They do not touch production Firestore.

## Run locally

Requirements: Node.js 20+, Java 17+, npm.

```sh
git checkout feature/fire-class-invite-links
npm install
npm run test:fire-rules
```

The test runner starts the Firestore emulator, loads `firestore.rules`, executes `tests/fire-class-rules.test.mjs`, and shuts down the emulator.

## Manual preview checklist

Use a separate Firebase test project and a static hosting preview. Set `firebase-config.js` for that **test project only**. Do not use the production Firebase project for testing.

1. Sign in with a verified admin and create two classes.
2. Assign an instructor to both classes.
3. In the instructor dashboard, create a link, enable it, and set capacity to 2.
4. Sign in with a verified test student, open the link, choose a department, and enroll.
5. Verify the student's name, department, and enrollment in the class roster.
6. Test a second student, then a third student: the third must be rejected.
7. Edit a student, deny them, and check that they cannot use the same link to rejoin.
8. Test transfers between classes, including a full destination and unauthorized instructor.
9. Rotate the invitation link: the old link must no longer work.
10. Verify study history and quiz progress before and after a transfer.

## Release blockers to resolve before merging

- **Transfer and instructor-admission permissions:** the rules deliberately no longer let instructors directly change `enrollmentCount`. The current instructor transfer and manual-admission buttons therefore need a secure server-side endpoint or redesigned atomic authorization rules. Do not publish these features as working yet.
- **Seat count migration:** existing `classMembers` documents need to be counted into `classes.enrollmentCount` before links are enabled. Otherwise the advertised free seats can be wrong.
- **Verified auth flow:** the invite page requires a signed-in, verified account; users who sign in from the study hub must return to the invitation link.
- **Security hardening:** review student-controlled profile/progress fields, instructor changes to `blockedEmails`, denial/reapproval workflow, and legacy class data.
- **Emulator execution:** the tests have been authored but have not yet been executed or passed in a local emulator. Fix any failing cases before deployment.
- **Production rules:** GitHub does not automatically publish `firestore.rules`. Do not paste these draft rules into production until the tests and manual preview pass.

Automated invitation emails are **not** part of this phase. Firebase Auth continues to handle account verification and password resets.
