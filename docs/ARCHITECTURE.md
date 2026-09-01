# My Reading Room — Architecture

## High-level design

```text
Browser / PWA
   │
   ├── UI: index.html + styles.css + app.js
   ├── Local-first persistence: localStorage
   ├── PWA shell: manifest.webmanifest + sw.js + icon.svg
   │
   └── Firebase cloud layer
        ├── Firebase Authentication
        └── Cloud Firestore
```

## Local-first behavior

The browser remains the immediate working copy. UI actions save meaningful Reading Room state locally first so the app remains useful without an active network connection. A debounced hybrid sync pushes only locally changed records. Full two-way cloud reconciliation is limited to signed-in startup, sign-in, bulk restore and manual **Sync Now**.

## Cloud organization

```text
users/{uid}/
├── books/{bookId}
├── deletions/{bookId}
├── settings/app
└── meta/state
```

A book document contains the book's own meaningful fields, including embedded Reading Sessions and finished-book journal/memory fields. This preserves the existing UI model while avoiding the old single-giant-library cloud payload.

## Cross-device safety

The sync layer maintains per-book baselines/timestamps in local browser storage. Deletion markers prevent a clean device with an older local copy from resurrecting a book that was deleted on another device. Targeted pushes compare the changed cloud record's timestamp before writing, and newer local edits are preserved if they occur while an earlier network request is still running.

## What is intentionally not cloud data

Transient route state, open dialogs, search text, focus state, temporary form state and other device-specific UI details are not part of the meaningful synchronized Reading Room dataset.

## PWA behavior

The service worker keeps the app installable and provides network-failure fallback behavior without introducing a second data store. The app should still be treated as local-first rather than relying solely on the service worker cache for user data.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
