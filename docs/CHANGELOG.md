# My Reading Room — Changelog

## V7.0.12 — Low-read Hybrid Sync (2026-09-01)

- Removed the 60-second full-library Firestore polling loop and duplicate focus/visibility reconciliation calls.
- Local edits now debounce and push only changed book/deletion/settings records.
- Changed-record pushes read only the affected cloud documents before writing, preserving timestamp conflict protection with bounded read usage.
- Full two-way reconciliation now occurs on signed-in startup, sign-in, bulk restore and **Sync Now**.
- Pending offline changes retry when the browser reconnects.
- Hardened synchronization so edits made while a network request is in flight retain their newer dirty timestamps.
- Preserved the complete V7.0.11 UI and reading feature set.

## V7.0.11 — Final UI & Audiobook Polish (2026-08-26)

- Audiobook Reading Details now tracks total/current **time (HH:MM:SS)** instead of pages.
- Audiobook Reading Sessions use **Start time / End time** and session history shows time ranges; standard books continue to use pages.
- Added compact hour/minute/second selectors sized for the existing Reading Room forms.
- Added a themed calendar/date picker using the existing cream/brown Reading Room palette.
- Fixed mobile Finished-page shelf rows so book listings scroll horizontally instead of being clipped.
- Fixed desktop wrapped shelves so each physical row renders one wooden shelf and one continuous leafy fairy-light string only.
- Fixed first-open TBR/Finished shelf rendering: row measurements now run after the page becomes visible, so shelves and fairy lights no longer require a refresh to appear.
- Preserved all existing Firebase, offline, backup, PWA, cover, journal, stats and UI behavior.


## V7.0.4 — Adaptive Cover Quality

- Replaced aggressive quality-first compression with display-oriented resizing plus highest-quality-under-cap selection.
- Keeps the strict <10 KB storage limit while preserving text, edges and photographic detail more effectively.
- Detailed covers reduce dimensions before dropping to destructive WebP quality levels.
- Existing already-compressed covers are not repeatedly degraded; re-upload the original image to improve an older pixelated cover.

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

## V7.0.5 — Visible Copyright Footer
- Added a visible app footer: © 2026 Krishna Bhatt. All rights reserved.
- Preserved existing source-code and documentation copyright notices.
- No database, Firebase sync, cover-compression, or feature behavior changed.

### V7.0.11 mobile Finished shelf containment hotfix
- Fixed iPhone/iOS Safari behavior where a Finished year shelf could widen the whole page and make the entire screen scroll horizontally.
- Horizontal swiping is now contained inside each Finished shelf row, matching the Room/TBR shelf behavior.
- Native shelf scrollbars remain hidden while touch scrolling stays enabled.
