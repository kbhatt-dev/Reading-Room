# My Reading Room — Release Testing Checklist

## Core navigation

- [ ] Room opens and renders correctly.
- [ ] TBR opens and matches Room's Next on TBR data.
- [ ] Reading opens and progress/session controls work.
- [ ] Finished opens and detailed journal view works.
- [ ] Stats opens and re-renders after data changes/sync.
- [ ] Sync opens and reports the expected Firebase account/state.

## Books

- [ ] Add one TBR book.
- [ ] Edit title/author/genre/format/status.
- [ ] Move a book TBR → Reading → Finished.
- [ ] Delete a test book.
- [ ] Search/filter finds expected records.

## Covers

- [ ] Upload a phone photo/screenshot cover.
- [ ] Confirm accepted cover is under 10 KB.
- [ ] Confirm shelf image quality is acceptable on iPhone.
- [ ] Replace an existing oversized cover in-place.
- [ ] Remove a cover.

## Reading

- [ ] Add Reading Session with a backdated date.
- [ ] Edit date/minutes/pages/mood.
- [ ] Delete session.
- [ ] Reading progress updates correctly.
- [ ] Predictions/theories persist.

## Calendar and Stats

- [ ] Empty calendar date can add a session.
- [ ] Calendar edit/delete works.
- [ ] Session moves when its date changes.
- [ ] Stats update after local change and cloud sync.
- [ ] Goals/challenges/achievements render correctly.

## Finished journal

- [ ] Rating persists.
- [ ] Thoughts persist.
- [ ] Favourite character/scene/quote persist.
- [ ] Story memory persists.
- [ ] Hall of Fame flag is searchable.

## Firebase cross-device

- [ ] Desktop add → iPhone receives.
- [ ] iPhone edit → desktop receives.
- [ ] Desktop delete → iPhone removes.
- [ ] Session changes sync both directions.
- [ ] Cover changes sync both directions.
- [ ] Goals/themes sync both directions.

## Offline

- [ ] App opens with network unavailable after prior use.
- [ ] Local edit works offline.
- [ ] Reconnect and sync delivers the change.

## Backup/data safety

- [ ] JSON export downloads successfully.
- [ ] JSON import restores expected data.
- [ ] Reading Journal export works.
- [ ] Reset Reading Data clears library documents while Authentication profile remains.

## Mobile/accessibility

- [ ] No iPhone input zoom on forms.
- [ ] Dialogs fit viewport and scroll internally when needed.
- [ ] Bottom navigation remains usable.
- [ ] Buttons/touch targets are comfortably tappable.
- [ ] Focus states are visible with keyboard navigation.
- [ ] Text wraps without horizontal overflow.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
