# My Reading Room — Lifetime Maintenance Plan

## Goal

Keep the application usable for many years without turning it into a maintenance-heavy service.

## Every few months

- Export a JSON backup.
- Confirm Firebase sign-in still works.
- Check one desktop ↔ iPhone sync.
- Review browser console for repeated errors.
- Confirm PWA install/launch still works after browser/iOS updates.

## Once a year

- Export and verify a full JSON archive.
- Export the human-readable Reading Journal.
- Review Firebase usage and security rules.
- Review cover sizes and storage growth.
- Remove obsolete test data.
- Update documentation/version notes if behavior changed.

## Every 1–2 years

Create an archive such as `Reading-Room-2026-2027.json`, verify it, store multiple copies, and optionally clear old active cloud data before starting the next period. Keep the Firebase profile so the same identity can continue to own the new active library.

## Dependency strategy

The app intentionally uses plain HTML/CSS/JavaScript and a simple Firebase boundary. Avoid introducing frameworks or dependencies solely for cosmetic improvements; long-term reliability is more valuable than architectural churn.

## Backend migration principle

If Firebase ever needs to be replaced, preserve the local data model and UI. Replace the cloud adapter incrementally, export a backup first, test with a small library, then perform a full cross-device regression before removing the previous backend.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
