# My Reading Room — Security & Privacy

## Authentication boundary

Cloud data is scoped to the authenticated Firebase UID. Firestore Security Rules must require `request.auth.uid == userId` for `users/{uid}/**`.

## Firebase Web config

The Firebase Web `apiKey`, `authDomain`, `projectId`, `appId` and related client configuration are identifiers used by the browser SDK/REST APIs. They are not Firebase Admin credentials. Even so, restrict the API key to the required Firebase APIs and allowed web referrers where practical.

## Never commit

Do not commit:

- Firebase Admin SDK private keys
- service-account JSON
- private OAuth client secrets
- passwords
- recovery codes
- unrelated personal tokens

## Data minimization

Reading Room intentionally synchronizes meaningful reading data rather than transient UI state. Covers are aggressively compressed to reduce bandwidth/storage and exposure surface.

## Personal repository caution

A public repository exposes the application source code and Firebase Web configuration. Security must therefore rely on Authentication, Firestore Rules and key restrictions—not secrecy of client JavaScript.

## Privacy

Reading data is personal content. Keep backups in locations you control, avoid sharing exports unintentionally and review Firestore access rules after backend changes.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
