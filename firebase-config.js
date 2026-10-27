// Firebase web app config for the Fire Study Hub (project: fire-study-hub).
// These values are not secret. Security comes from the Firestore rules, so it's fine for this file to be public on GitHub.
export const firebaseConfig = {
  apiKey: "AIzaSyDweHXO0m0Tt0DoVy-r5NoeKd93vrog0n8",
  authDomain: "fire-study-hub.firebaseapp.com",
  projectId: "fire-study-hub",
  storageBucket: "fire-study-hub.firebasestorage.app",
  messagingSenderId: "941911200809",
  appId: "1:941911200809:web:dd8ec275241ad87ee6f838"
};

// Site admin accounts (full access to the Admin Dashboard). Must match the list in firestore.rules.
export const ADMIN_EMAILS = ["stewardle132@gmail.com", "rsteward@responsiveedtx.com"];
