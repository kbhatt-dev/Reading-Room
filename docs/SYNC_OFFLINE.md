# My Reading Room — Sync & Offline Behavior

## Normal sync

Meaningful local edits mark Reading Room data as changed. When the user is authenticated, the Firebase layer reconciles per-book and shared-setting data with Firestore instead of uploading one giant application snapshot.

## Device-to-device expectations

A change made on desktop should reach iPhone after synchronization, and the reverse should also work. Test add, edit and delete operations because all three exercise different reconciliation paths.

## Offline use

The app remains usable with local browser data when the network is unavailable. After connectivity returns, synchronize before making conflicting edits on a second device whenever possible.

## Conflict philosophy

The implementation uses saved baselines/timestamps and deletion markers to reduce stale-device overwrites. It is still good practice not to edit the exact same book simultaneously on two offline devices.

## Sync Now

**Sync Now** requests an immediate two-way reconciliation. It should not be treated as a forced upload of the current device.

## Cloud reset

Reset Reading Data removes Reading Room Firestore documents but preserves the Firebase Authentication user. A device that still contains stale local data should not silently recreate the deleted cloud library unless meaningful new local changes are deliberately made.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
