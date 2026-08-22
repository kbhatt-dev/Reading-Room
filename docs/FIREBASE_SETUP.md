# My Reading Room — Firebase Setup

## 1. Create the Firebase project

Create a Firebase project and register a **Web app**. Firebase Hosting is not required when the PWA is hosted elsewhere.

## 2. Configure the web app

Copy the Firebase Web configuration values into `firebase-config.js`:

```js
window.READING_ROOM_FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

Never place a Firebase Admin SDK private key, service-account JSON, account password or other server credential in the browser project.

## 3. Authentication

Enable **Authentication → Sign-in method → Email/Password**. Create the personal user account in Firebase Authentication or use the supported app login flow. Add the deployed host (for example `kbhatt-dev.github.io`) to Authentication's Authorized domains when required.

## 4. Firestore

Create a Cloud Firestore database in Production mode. Reading Room creates its own user-scoped documents as the app is used.

Recommended rules:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
      match /{document=**} {
        allow read, write: if request.auth != null
                           && request.auth.uid == userId;
      }
    }
  }
}
```

## 5. API-key restrictions

Firebase Web API keys are client identifiers, but the Google Cloud key should still be restricted to the Firebase APIs the app needs. For a GitHub Pages deployment, an HTTP referrer restriction can be limited to the deployed site plus explicit localhost URLs used for development.

## 6. First test

Before importing a real library, sign in and create one obvious TBR test book. Confirm a document appears under the authenticated user's `books` collection, then test edit/delete and desktop ↔ iPhone synchronization.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
