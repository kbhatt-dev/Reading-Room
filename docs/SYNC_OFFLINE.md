# My Reading Room — Sync & Offline Behavior

## Normal sync

Meaningful local edits mark Reading Room data as changed. When the user is authenticated, a short debounce sends only the changed book/deletion/settings records to Firestore instead of re-reading or uploading the entire library.

Full cloud-to-device reconciliation runs once when a signed-in app opens, immediately after sign-in, after a bulk backup restore, or when **Sync Now** is selected. The app does not poll the full Firestore library on a timer or whenever the tab receives focus.

## Device-to-device expectations

A local change is uploaded automatically. On another device, open/reopen the app or select **Sync Now** to retrieve it. Test add, edit and delete operations because all three exercise different reconciliation paths.

## Offline use

The app remains usable with local browser data when the network is unavailable. Pending local edits retry when connectivity returns. Use **Sync Now** on another device before making conflicting edits whenever possible.

## Conflict philosophy

The implementation uses saved baselines/timestamps and deletion markers to reduce stale-device overwrites. It is still good practice not to edit the exact same book simultaneously on two offline devices.

## Sync Now

**Sync Now** requests an immediate two-way reconciliation. It should not be treated as a forced upload of the current device.

## Firestore read behavior

Routine local saves read only the affected record before writing it. A full collection read is reserved for startup/sign-in/manual reconciliation, so leaving the app open does not continuously consume Firestore reads.

## Cloud reset

Reset Reading Data removes Reading Room Firestore documents but preserves the Firebase Authentication user. A device that still contains stale local data should not silently recreate the deleted cloud library unless meaningful new local changes are deliberately made.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
