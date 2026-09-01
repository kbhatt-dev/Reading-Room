# My Reading Room V7.0.12 — Hybrid Sync Reliability Release

> Copyright © 2026 Krishna Bhatt. All rights reserved.

My Reading Room is a cozy, local-first personal reading journal and PWA for desktop and iPhone. V7 uses Firebase Authentication + Cloud Firestore hybrid cross-device sync while preserving local/offline operation, JSON backup/import, Reading Journal export and the existing Reading Room UI.

**Current release: V7.0.12** — replaces the one-minute full-library polling loop with low-read hybrid synchronization without changing the established Reading Room design or reading features.

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
| [`docs/V7.0.12_RELEASE_NOTES.md`](docs/V7.0.12_RELEASE_NOTES.md) | V7.0.12 hybrid sync reliability summary |
| [`docs/V7.0.11_RELEASE_NOTES.md`](docs/V7.0.11_RELEASE_NOTES.md) | V7.0.11 UI and audiobook summary |
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

## V7.0.12 — Low-read Hybrid Sync

- Local book, session, cover, goal, genre and theme changes are still sent automatically after a short debounce.
- Automatic saves check only the changed book/deletion document or settings document before writing, preserving timestamp conflict handling without re-reading the whole library.
- Full two-way reconciliation runs once when the app opens while signed in, after sign-in, after a bulk backup restore, or when **Sync Now** is selected.
- Removed the previous 60-second full-library poll and duplicate focus/visibility sync triggers that could exhaust Firestore's daily read quota.
- Offline edits stay marked as pending and retry automatically when the connection returns.
- The application UI and all existing Reading Room features remain unchanged.

## V7.0.11 — Final UI & Audiobook Polish

- **Audiobook progress:** Reading Details uses **Total time / Current time** instead of page counts when a book format is Audiobook. Time is stored/displayed as **hours, minutes and seconds**.
- **Audiobook sessions:** Add/Edit Reading Session automatically uses **Start time / End time** for audiobooks while non-audiobooks keep **Start page / End page**. Session history also displays audiobook time ranges rather than page ranges.
- **Compact time controls:** Hour/minute/second selectors were resized to fit the existing modal layout and Reading Room visual scale.
- **Themed date picker:** Reading-related dates use a custom calendar UI styled with the app's existing cream/brown palette instead of a mismatched browser/system picker.
- **Finished mobile shelves:** Finished-page shelf rows horizontally scroll on phone like the other mobile shelves, preventing book cards from being cut off.
- **Desktop shelf lights:** Each physical shelf row now renders exactly **one continuous leafy fairy-light thread** and one wooden board, preventing repeated/stacked vines behind books.
- **Shelf continuity:** Fairy lights remain continuous across a physical shelf row rather than being broken into per-book segments.
- **First-open TBR shelf fix:** Shelf boards and fairy lights are re-measured after the TBR/Finished page becomes visible, so they appear correctly on the first visit without requiring a browser refresh.
- Existing Firebase sync, local/offline storage, cover compression, PWA behavior, stats, journal data, backup/import, and established UI remain unchanged.

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



## V7.0.10 — Safari-safe Cover Fallback

- Cover uploads now use a deterministic browser-safe pipeline: JPG/PNG/WebP → resize → WebP when supported → automatic JPEG fallback when WebP encoding is unavailable.
- The optimizer progressively reduces dimensions and quality until the final stored cover is below 10 KB, with a 9.5 KB working target.
- Safari/iPhone users no longer need to manually convert a cover merely because WebP canvas encoding is unavailable on that device.
- Existing Firebase Authentication, per-book Firestore sync, local/offline behavior, backups, journals, sessions, goals, stats, PWA behavior and visible copyright footer are unchanged.
- Firestore storage remains bounded by keeping each embedded cover below 10 KB before it is synchronized with its book document.

## V7.0.9 — Reliable Cover + Storage Stabilization
- Normal browser-decodable JPG/PNG/WebP covers are resized first, encoded as WebP, and progressively reduced until safely below the strict 10 KB binary cover cap.
- Uses a 9.5 KB working target for safety headroom and preserves aspect ratio.
- Existing Firebase/Firestore per-book sync architecture is unchanged: one book document per book, so covers are not duplicated into a whole-library snapshot.
- Storage usage reporting remains available in Sync/Data Management.


### V7.0.11 mobile shelf hotfix
Finished year shelves on iPhone/iOS Safari are constrained to the viewport so horizontal swiping stays inside the bookshelf instead of moving the entire page. Shelf scrollbars are hidden to preserve the clean Reading Room UI.
