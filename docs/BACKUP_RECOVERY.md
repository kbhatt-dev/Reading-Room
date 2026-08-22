# My Reading Room — Backup & Recovery

## Backup types

### JSON backup

Use JSON export as the canonical restorable backup. It is intended to preserve meaningful Reading Room data so the library can be reconstructed after browser loss, device replacement or a reset.

### Reading Journal export

Use the human-readable Reading Journal export for long-term reading memories and review outside the app. It complements rather than replaces the JSON backup.

## Recommended lifetime routine

- Export JSON after meaningful milestones and before major upgrades.
- Keep at least two copies in different locations.
- Every 1–2 years, create a clearly named archive such as `Reading-Room-2026-2027.json`.
- Verify the archive can be imported before deleting old active cloud data.
- Keep old archives read-only once verified.

## Recovery test

1. Export JSON.
2. Add a temporary test book.
3. Import the backup.
4. Confirm the temporary book disappears if it was not in the backup and original books/settings return.
5. Re-check Stats, Calendar, sessions and Finished journal details.
6. Confirm the restored local data synchronizes correctly when signed in.

## Before Reset Reading Data

Always export a fresh JSON backup first when the library contains data you want to keep.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
