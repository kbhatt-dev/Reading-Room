# My Reading Room — Project Handoff

## Source of truth

The complete release ZIP/repository is the source of truth. Future maintenance should begin by inspecting the current working version rather than rebuilding the app.

## Preserve these invariants

- Separate Room, TBR, Reading, Finished, Stats and Sync pages.
- Mobile bottom navigation with those destinations.
- Add/Edit Book workflow and status-conditional fields.
- Reading progress, predictions and Reading Sessions.
- Finished-book journal/memories and Hall of Fame data.
- Search, goals, challenges, achievements, Stats and monthly Reading Calendar.
- JSON backup/import and human-readable Reading Journal export.
- Shelf customization, fairy-light/leaf bookshelf design and line-style icons.
- Firebase Authentication + Firestore sync.
- Local/offline operation and PWA behavior.
- Tiny cover policy: target ~8 KB, maximum <10 KB.

## Change policy

1. Inspect the current code first.
2. Make the smallest targeted change.
3. Do not rebuild working areas to fix an isolated problem.
4. Do not remove meaningful data fields while cleaning code.
5. Validate JavaScript after each update.
6. Test desktop and iPhone before accepting a release.
7. Test Firebase and local-only/offline paths after any persistence change.
8. Export a JSON backup before destructive migrations.

## Priority order

**Reliability → Mobile usability → Data safety → Performance → visual polish.**

## Ownership

This project and its original source/documentation are marked: **Copyright © 2026 Krishna Bhatt. All rights reserved.**

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
