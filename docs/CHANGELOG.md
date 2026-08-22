# My Reading Room — Changelog

## V7.0.3 — Documentation & Ownership Package

- Added complete project documentation under `/docs`.
- Added Krishna Bhatt copyright ownership notices to source/document files without changing application behavior.
- Added HTML author/copyright metadata.
- Preserved Firebase Authentication, Firestore sync, local/offline behavior, PWA support and <10 KB cover policy.

## V7.0.2 — Final Firebase Sync UI

- Hid Firebase API Key / Project ID setup fields from the everyday Sync UI.
- Kept cloud status, signed-in account, Sync Now, Sign Out and data-management tools.

## V7.0.1 — Dedicated Firebase Config

- Moved Firebase Web configuration to `firebase-config.js`.
- Kept application logic in `app.js` and loaded configuration before it.

## V7.0 — Firebase Lifetime Release

- Replaced Supabase runtime sync with Firebase Authentication + Cloud Firestore.
- Moved from a giant cloud snapshot toward per-book Firestore documents and shared settings.
- Added cross-device deletion markers and safer reconciliation.
- Returned cover policy to ~8 KB target / <10 KB maximum for better visual quality.

## V6.8.x stabilization line

- Repaired Calendar Add/Edit/Delete session flows and backdated session dates.
- Hardened cross-device synchronization.
- Removed Room's TBR preview truncation so Room and TBR reflect the same collection.
- Added cloud Reading Data reset behavior while preserving the authentication profile.
- Iterated cover compression and storage hardening before the final V7 quality policy.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
