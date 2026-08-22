# My Reading Room V7.0.5 — Firebase Lifetime Release

> Copyright © 2026 Krishna Bhatt. All rights reserved.

My Reading Room is a cozy, local-first personal reading journal and PWA for desktop and iPhone. V7 uses Firebase Authentication + Cloud Firestore for cross-device sync while preserving local/offline operation, JSON backup/import, Reading Journal export and the existing Reading Room UI.

## Final architecture

- **Frontend:** HTML + CSS + vanilla JavaScript
- **PWA:** `manifest.webmanifest`, `sw.js`, `icon.svg`
- **Local data:** browser localStorage
- **Cloud:** Firebase Authentication + Cloud Firestore
- **Cloud model:** per-book documents + shared settings + deletion markers
- **Cover policy:** adaptive quality-first WebP, strict **<10 KB** maximum

## Main features

Room dashboard, TBR, Currently Reading, Finished library, Reading Sessions, progress tracking, predictions/theories, finished-book journal/memories, favourite character/scene/quote, story memories, Hall of Fame data through Advanced Search, Reading Goals, monthly challenges, achievements, random TBR picker, advanced Stats, reading streaks, monthly Reading Calendar, session management, JSON backup/import, human-readable Reading Journal export, backup health/reminders, storage information, shelf themes/customization, Firebase cloud sync, local/offline use and PWA/iPhone support.

## Firebase configuration

Copy only the Firebase **Web App** configuration into `firebase-config.js`. Never place Admin SDK/service-account credentials, private keys or passwords in the browser project. Firestore Security Rules must scope `users/{uid}/**` to the matching authenticated UID.

## Documentation

| Document | Purpose |
|---|---|
| [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) | Product scope and final feature set |
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | Everyday use |
| [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md) | Firebase/Auth/Firestore setup |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Technical architecture |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Book/session/settings/cloud data model |
| [`docs/SYNC_OFFLINE.md`](docs/SYNC_OFFLINE.md) | Cross-device and offline behavior |
| [`docs/BACKUP_RECOVERY.md`](docs/BACKUP_RECOVERY.md) | Backup, restore and archival strategy |
| [`docs/TESTING_CHECKLIST.md`](docs/TESTING_CHECKLIST.md) | Desktop/iPhone/Firebase release test |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Local and GitHub Pages deployment |
| [`docs/SECURITY_PRIVACY.md`](docs/SECURITY_PRIVACY.md) | Security boundaries and secrets guidance |
| [`docs/MAINTENANCE_LIFETIME.md`](docs/MAINTENANCE_LIFETIME.md) | Long-term maintenance/archive plan |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Common problems and recovery |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Release history |
| [`docs/PROJECT_HANDOFF.md`](docs/PROJECT_HANDOFF.md) | Rules for future maintenance |
| [`docs/COPYRIGHT.md`](docs/COPYRIGHT.md) | Ownership notice |

## Development validation

```bash
node --check app.js
node --check firebase-config.js
```

For local browser testing:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Release rule

Future changes should be incremental. Preserve working features, meaningful reading data, Firebase/local behavior, PWA support and mobile usability. Export a JSON backup before destructive data-model/backend changes.

## Historical notes

The previous README contained the detailed V5/V6 stabilization history. The curated release history is now summarized in [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

---

Copyright © 2026 Krishna Bhatt. All rights reserved.


## V7.0.7 — Cover Upload Hotfix

- Restores the missing browser Blob/File → data URL helper used by phone cover optimization.
- Fixes the `readBlobAsDataURL is not defined` upload regression while preserving the adaptive <10 KB cover optimizer.
- Corrects the large-input message to match the existing 20 MB input limit.

## V7.0.6 — Phone Cover Optimizer

Improves large phone/Pinterest cover imports by preserving aspect ratio, resizing before quality reduction, and using a deeper fallback so detailed images can still be stored below 10 KB without being rejected unnecessarily. HEIC/HEIF decode failures now give a clear JPG conversion instruction.


## V7.0.8 — Cover Helper Hotfix

- Restores the missing `dataUrlBytes()` helper used by cover optimization and storage reporting.
- Preserves the V7.0.7 phone cover optimizer, Firebase/Firestore sync, PWA behavior, visible copyright footer, and all existing reading features.
