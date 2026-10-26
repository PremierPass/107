# Fire Study Hub: Firebase setup

The site stays on GitHub Pages. Firebase only handles accounts and saving progress.

1. Go to https://console.firebase.google.com while signed in to the new Google account. Click **Create a project**, name it (for example `fire-study-hub`), and turn Google Analytics off.
2. **Build > Authentication > Get started.** On the Sign-in method tab, enable **Email/Password** and **Google**. For Google, pick your new Gmail as the support email.
3. **Authentication > Settings > Authorized domains > Add domain.** Add your GitHub Pages address, for example `yourname.github.io` (just the domain, no https:// or path).
4. **Build > Firestore Database > Create database.** Pick a US location and start in **production mode**.
5. In Firestore, open the **Rules** tab, delete what's there, paste everything from `firestore.rules`, and click **Publish**.
6. **Project settings (gear icon) > General > Your apps > Web (</>)**. Name it, skip Firebase Hosting, and register. Copy the `firebaseConfig` values into `firebase-config.js`.
7. Upload the files to the repo root and wait a minute for GitHub Pages to update.

What gets saved per account: FF I & II flashcard marks and missed quiz questions, hazmat flashcard marks and missed quiz questions, and the prerequisite checklist. Stored at `users/{uid}/progress/{ff12 | hazmat | prereqs}`.

Signed-out users still work normally; their progress stays on their own device. When they sign in, what's on the device is merged into their account.

The values in firebase-config.js are not secret. The Firestore rules are what keep each person's data private.
