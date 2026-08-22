# My Reading Room V7.0.1 — Firebase Config File Hotfix

## Firebase configuration file

Firebase project values now live in the dedicated `firebase-config.js` file. Copy the standard Firebase Web App configuration values from Firebase Console into that file and reload the app. `firebase-config.js` must load before `app.js`, which is already configured in `index.html`.

Do not place passwords, Admin SDK credentials, service-account JSON, or private keys in `firebase-config.js`. Only the normal Firebase Web configuration belongs there. Firestore Security Rules must restrict `users/{uid}/**` to the authenticated matching UID.

## Backend migration

- Replaced the Supabase runtime integration with Firebase Authentication + Cloud Firestore REST APIs.
- The app remains local-first: all existing pages and offline/localStorage behavior continue to work even before Firebase is configured.
- Firestore stores each book as its own document under `users/{uid}/books/{bookId}` instead of uploading one giant library snapshot. Reading sessions and journal/memory fields remain inside their parent book document so the existing UI/data model does not need a risky rewrite.
- Small shared settings (genres, shelf themes, yearly goals and monthly challenges) are stored in `users/{uid}/settings/app`.
- Deletion markers under `users/{uid}/deletions/{bookId}` make cross-device book deletions safe without resending the whole library.
- Sync compares per-book content against the last common baseline, so a clean/stale device should download newer records instead of overwriting another device.
- Reset Reading Data deletes the user's Reading Room Firestore documents while keeping the Firebase Authentication profile.
- No Firebase Admin/service-account credential is used in the browser. Firestore Security Rules must restrict `users/{uid}/**` to the authenticated matching UID.

## Lifetime cover policy

- Changed the overly aggressive sub-8 KB policy to an approximately **8 KB target with a strict <10 KB maximum**.
- Maximum initial thumbnail size increased to 260 × 390 px and WebP quality is reduced gradually before dimensions are reduced, improving shelf readability on iPhone.
- Existing embedded covers at or above 10 KB are eligible for in-place recompression; already-small covers are not repeatedly degraded.

## Compatibility

- Room, TBR, Reading, Finished, Stats, Sync, sessions/calendar, goals, challenges, search, journal exports, JSON backup/import, Reset Reading Data, shelf customization, PWA behavior and mobile navigation are preserved.
- V7 uses new Firebase-specific local configuration/session keys; old Supabase browser settings are ignored rather than used by the new runtime.
- Firebase configuration is intentionally not hard-coded. Until a Firebase project/API key is entered on Sync, V7 operates in local mode.

# Reading Room V6.8.9 — Cloud Data Reset Hotfix

- Reworked sync decision logic around an explicit local-dirty marker: a clean device now always downloads a different cloud snapshot instead of ever pushing a stale cache.
- Local book/session/goal/genre/theme edits mark the device dirty; a successful upload or cloud download clears that marker.
- Preserved the existing single-row Supabase schema and complete meaningful-data payload. Temporary UI state remains local-only.
- Room → Next on TBR now renders the full TBR collection instead of silently truncating it to 9 books, so Room and TBR pages reflect the same saved TBR data.
- Preserves V6.8.7 sub-8 KB cover hardening and all session/calendar fixes.

# Reading Room V6.8.7 — Extra-Tiny Cover Hardening

- Audited every persistent Reading Room storage key. Supabase sync now carries all meaningful app data: the complete books array (TBR, Reading, Finished, DNF, journal fields, predictions, Hall of Fame flag, reading sessions, dates/progress and covers), custom genres, shelf themes/customization, yearly goals and monthly challenges.
- Temporary/device-only state remains local: Supabase credentials/session, backup-health timestamp, route/dialog/search state and other UI-only state.
- Replaced timestamp-only cross-device change detection with a payload fingerprint baseline, preventing a stale device from treating an older TBR/library snapshot as current just because device clocks or legacy sync timestamps disagree.
- Added a safe migration path for devices upgrading from older timestamp-only sync. When there is no unsynced local edit, an existing cloud snapshot is downloaded first rather than overwritten by a stale shelf.
- Serialized overlapping automatic sync requests so save/focus/visibility/online timers cannot race each other.
- Existing-cover optimization now uses normal two-way reconciliation after compression instead of a forced cloud overwrite.
- Sync fingerprints are scoped per signed-in Supabase user. Reset Reading Data updates the matching fingerprint after intentionally replacing the cloud snapshot.
- No Supabase table/schema changes are required.

# Reading Room V6.8.5 — Tiny Cover Hardening

- Strengthened book-cover optimization for high-detail iPhone photos and screenshots that could remain around 40–90 KB after the previous compressor stopped reducing quality/resolution.
- New uploads still target about 8 KB, with ~10 KB treated as the practical maximum.
- The compressor can now reduce both WebP quality and thumbnail dimensions further when needed, with a small-thumbnail fallback for unusually complex images.
- Existing embedded covers above ~10 KB are automatically re-optimized on startup and replaced in-place rather than duplicated.
- Existing covers already at or below ~10 KB are left untouched to avoid unnecessary quality loss.
- No book, journal, session, goal, shelf, backup, authentication, or Supabase schema changes were made.

# Reading Room V6.8.4 — Cross-Device Sync Hotfix

- Fixed two-way Supabase synchronization so a device with no new local changes downloads a newer cloud library instead of treating its stale copy as current.
- Fixed **Sync Now** so it performs a normal two-way reconciliation instead of blindly forcing the current device copy over the cloud.
- Preserved the local change timestamp after cloud uploads so an edit made while a sync request is still in flight remains marked as unsynced and is picked up by the next sync.
- Added safer handling when both local and cloud copies changed, while keeping the existing single-payload Supabase schema unchanged.
- Reading Sessions, session dates, books, journal data, goals, shelf themes, covers, backups, offline mode, and PWA behavior remain compatible.
- No Supabase table/schema changes are required.

# My Reading Room — V5

## V6.8.3 — Reading Session Date Hotfix

- Fixed Reading Session date handling so Add Session saves the date shown in the form instead of always using the current date.
- Editing a Reading Session now loads its stored date into the date field and saves any date change correctly.
- Restored the calendar Add Session flow for empty/filled dates, including the Currently Reading / Finished book selector.
- Calendar-created and calendar-edited sessions now return to the correct saved date after Save and refresh Stats/calendar immediately.
- Preserved the existing session data structure and Supabase/local-storage sync format.


## V6.8.2 — Calendar Stability Hotfix

- Fixed Add Session from empty calendar dates and made the action use the calendar-session flow directly.
- Calendar session creation can choose from Currently Reading or Finished books, which also supports backdated sessions.
- Fixed day-dialog refresh after session deletion so an already-open modal is updated safely.
- Removed duplicate Journal Tools event-listener registration from `renderFinished()`.
- Reworked startup order: local data renders first, cloud sync reconciles second, and the active page is rendered again after sync. This fixes pages appearing empty/stale on first load or reload.
- Stats explicitly re-renders after cloud downloads.
- Improved iPhone responsiveness for calendar-day/session dialogs with safe viewport widths, scrolling, single-column form fields, 16px inputs, and larger action buttons.
- No data schema or Supabase storage structure changed.


## V6.8.1 — Calendar Session Hub

- Every real date in the monthly Reading Calendar is now interactive, including days with no existing reading.
- Tapping a date opens a dedicated day view showing all Reading Sessions logged on that date.
- Existing day sessions can be edited or deleted directly from the calendar day view.
- Add Session from a calendar date automatically pre-fills that date and lets the user choose from Currently Reading books.
- The standard Reading Session editor now includes an editable Session Date field.
- Saving, editing, or deleting a calendar session refreshes Stats and the monthly calendar immediately.
- No separate calendar records are stored or synced; the calendar continues to derive everything from the existing Reading Sessions array.


## V6.8.0 — Clean Stats & Calendar

- Removed the Detective Score tile from Stats as unnecessary visual clutter.
- Replaced the GitHub-style yearly heatmap with a familiar monthly Reading Calendar showing actual dates, highlighted reading days, logged minutes, and session counts.
- Added Previous/Next month controls and tap/click day details showing the books and minutes read that day.
- Removed the separate Hall of Fame gallery from the Room page to improve mobile layout.
- Hall of Fame data is preserved. Advanced Search now includes a Hall of Fame filter using the existing `favoriteBook` flag.
- No Hall of Fame data, sessions, journal information, goals, or cloud storage structure was removed.


## V6.7.2 — Clean Start & Tiny Covers

- New and existing embedded covers now target about 6–10 KB, with an 8 KB target and ~10 KB soft maximum.
- Covers are converted to WebP and adaptively reduced to approximately 280 × 420 px maximum, with further quality/resolution reduction only when needed.
- Existing WebP covers already at or below ~10 KB are skipped; larger embedded covers are re-optimized and replaced in-place when the result is smaller.
- Added a collapsed Data Management section on Sync with a protected Reset Reading Data action.
- Reset requires typing RESET and offers Export Backup First.
- Reset clears library/test data, covers, sessions, journal data, goals/challenges, custom genres, and shelf customization while preserving Supabase connection settings and the signed-in account/session.
- When signed in, reset now **deletes the user's `reading_room_sync` row entirely** instead of storing an empty payload. The Supabase Auth account/profile remains untouched.
- A clean previously-synced device treats a missing cloud row as a propagated reset and clears its local Reading Room cache instead of recreating stale cloud data.
- A fresh cloud row is created again only after a genuine local Reading Room change is marked dirty and synced.
- Supabase RLS must allow the signed-in user to `DELETE` their own `reading_room_sync` row (`auth.uid() = user_id`).
- No Supabase Auth user/account deletion is performed.


## V6.7.1 — Ultra-Light Covers

- New book-cover uploads now target roughly 25–40 KB using compact WebP thumbnails.
- Cover dimensions are capped around 360 × 540 px with adaptive quality/resolution reduction when an image is still too large.
- Existing embedded covers larger than about 40 KB are automatically re-optimized after startup.
- When an existing cover compresses successfully, the old larger Base64 cover is replaced in the book record rather than retained as a second copy.
- After the optimized library is synced, the normal single Supabase sync payload is overwritten with the compact-cover version, so the app does not intentionally keep both old and new cover copies.
- Covers already at or below about 40 KB are skipped to avoid repeated quality loss.
- No book, journal, session, goal, shelf, achievement, or other meaningful data is removed.


## V6.7.0 — Cozy Milestones

- Added optional Reading Achievements calculated from existing books, pages, reading sessions, and logged minutes. Achievement progress is derived on demand; badges are not stored separately.
- Added an optional Monthly Reading Challenge inside the collapsed Reading Extras area on Room. Only the tiny monthly target value is saved with existing goal settings.
- Added Pick My Next Book on TBR. It randomly selects from current TBR books and stores no random-pick history.
- Reading Extras stays collapsed by default to keep the Room page clean on iPhone.
- No new Supabase tables, image data, achievement records, or random-picker records were introduced.


## V6.6.0 — Lifetime Library Tools

- Added a human-readable Reading Journal export as a standalone HTML file, separate from the restorable JSON backup.
- The journal export includes books, reading status, dates, ratings, journal memories, favourite quotes/characters/scenes, predictions, reading sessions, and optimized cover images where available.
- Added local Backup Health tracking on the Sync page. It remembers only the timestamp of the last JSON backup export on that device and warns when no backup exists or it is getting old.
- Added Advanced Search from the Room page with full-library text search plus status, genre, year, and rating filters. Search covers titles, authors, journal thoughts, story memories, favourite quotes/characters/scenes, predictions, and session text.
- Search indexes and backup-health status are local/on-demand only and are not added to the Supabase sync payload.
- No new Supabase tables or duplicate journal data were introduced.


## V6.5.2 — Collapsed Journal Tools

- Quotes Collection and Story Memories Search are now hidden inside one collapsed Journal Tools section on the Finished page.
- The Finished page stays clean on desktop and especially on iPhone.
- Journal tools are rendered only when expanded.
- No journal data was removed.
- No additional Supabase storage is introduced; both tools continue to derive results from existing saved book/journal fields.


## V6.5.1 — Storage Monitor

- Added a collapsed Storage Usage panel only on the Sync page.
- Shows estimated persistent Reading Room data on the device, optimized cover total/count, journal/settings size, average cover size, and the estimated Supabase sync payload size.
- Uses `navigator.storage.estimate()` when supported to show approximate browser storage used/quota/remaining on the current device.
- Does not sync or persist any usage metrics; all measurements are calculated on demand.
- Does not expose or require a Supabase service-role/admin key. Full Supabase project quota remains available only in the Supabase Dashboard.


## V6.5.0 — Journal Collections & Cover Tools

- Added Quotes Collection, derived from existing favourite-quote fields; no duplicate quote records are stored or synced.
- Added Story Memories Search across existing thoughts, spoiler/story memory, characters, scenes, predictions and quotes; the search index is generated in the browser and is not synced.
- Improved cover workflow with Replace and Remove controls plus the approximate optimized cover size.
- Keeps V6.3.1 cover compression/deduplication: replacing a cover stores only the new optimized cover in the book record and normal sync payload.
- No new Supabase tables, columns, quote collection data, search index, or duplicated memory records are introduced.


## V6.4.0 — Reading Insights

- Expanded Stats with session-based active days, session count, average session length, and existing yearly reading metrics.
- Added a yearly Reading Calendar heatmap calculated from existing Reading Sessions.
- Added current and longest reading streaks, also calculated from session dates.
- No new cloud-synced activity records are created: calendar, streaks, and advanced session insights are derived from existing book/session data to keep storage lean.
- Preserves V6.3.1 cover compression, deduplication, optimized sync payload, goals, shelf themes, and journal data.


## V6.3.1 — Storage Optimization

- Automatically resizes uploaded book covers to a maximum of 480 × 720 pixels and compresses them to WebP before saving/syncing.
- Targets roughly 180 KB per uploaded cover while preserving book-cover display quality.
- Performs a safe one-time-style optimization pass on existing oversized embedded covers; already-optimized covers are skipped on later loads.
- Deduplicates identical embedded cover images in cloud payloads and backup files through cover references.
- Sync payload contains only persistent reading data: books/journal fields, reading sessions, genres, shelf themes, and reading goals. Temporary UI/session state is not included.
- Keeps backward compatibility with older cloud payloads and backup files.


## V6.3.0 — Reading Goals

- Removed the Book Memory Cards section from Finished to keep the mobile experience cleaner and less crowded.
- Added a yearly Reading Goal with automatic progress based on finished books.
- Added a compact current-year goal card to Room and editable yearly goals to Stats.
- Reading goals are included in Supabase sync and local backup/restore.


## V6.2.6 — Leafy Fairy Lights

- Replaced the plain fairy-light wire with a subtle ivy-style leafy vine.
- Kept warm glowing bulbs and added small natural green leaves along the string.
- Applied the same leafy light design to standard shelves and generated multi-row shelves.
- Preserved shelf themes, theme sync, mobile layout, and all existing functionality.


## V6.2.5 — Fairy Wire + Theme Sync

- Refined shelf fairy lights into a thin, gently sagging wire with short bulb drops for a more natural string-light appearance on desktop and iPhone.
- Shelf customization themes now travel inside the existing Supabase JSON sync payload, so Room, TBR, and per-year Finished shelf colors can follow the signed-in account across devices.
- Local backups now include shelf themes as well. Older cloud payloads/backups without theme data remain compatible.


## V6.2.4 — Multi-Row Shelf Fix

- Fixed wrapped bookshelf rows appearing to float when a shelf contains many books.
- Every desktop TBR and Finished shelf row now receives its own wooden board and fairy-light string.
- Preserved existing mobile horizontal shelf behavior and all other application features.


## V6.2.3 — Per-Year Finished Shelf Customization

- Finished shelf themes can now be customized independently for each year.
- Each year heading has its own Customize Shelf button aligned beside the year label.
- Existing Finished shelf theme remains the fallback until a year receives its own theme.


## V6.2.2 — Fairy String Lights Hotfix

- Moved fairy lights beneath each wooden shelf board.
- Added a thin connecting wire/string so the bulbs look like actual fairy lights rather than isolated yellow dots.
- Preserved the shelf themes, natural plant, and all existing app functionality.


V5 is a full UI architecture rebuild focused on mobile usability and clear separation between parts of the reading journey.

## Pages
- **Reading Room / Home** — cozy landing page with Currently Reading, decorative finished shelf, decorative TBR shelf, and Hall of Fame.
- **TBR** — only books you want to read.
- **Reading** — active books with progress and quick Reading Session actions.
- **Finished** — completed books organized into decorated yearly shelves.
- **Statistics** — yearly reading insights.
- **Sync** — Supabase connection, login, manual fallback sync, and backup tools.

On iPhone, the main pages are accessible from a persistent bottom navigation bar. Add Book remains a floating action button above the navigation.

## Status-driven book editor
### TBR
Only asks for:
- title
- author
- status
- genre
- format
- cover

### Reading
Adds:
- pages
- current page
- start date
- prediction / theory

Changing a TBR book to Reading automatically fills today's start date.

### Finished
Adds:
- start/end dates
- rating
- thoughts
- spoiler/story memory
- prediction result
- Hall of Fame toggle

Changing a book to Finished automatically fills today's finish date.

## Reading Sessions
Reading Sessions use a separate compact modal rather than the main Add/Edit Book form. A session tracks:
- start page
- end page
- minutes
- mood
- date

Saving a session updates the book's current page.

## Compatibility
V5 intentionally preserves the existing storage keys and book structure used by previous Reading Room versions, so current local/Supabase data remains compatible.

## Cloud sync
Supabase Auth + RLS sync remains supported. Connection values are entered from the Sync page and are stored only in the browser on that device.

Automatic sync runs:
- after book/genre changes
- on app startup
- when returning to the app
- when the device comes online
- every 60 seconds while the app is visible

`Sync Now` remains as a manual fallback.

## PWA updates
The service worker does not persistently cache the app shell. New GitHub Pages releases check for an updated service worker and reload when the new version takes control.


## V5.1 — Custom Reading Room icon system
- Replaced system emoji navigation icons with a consistent inline SVG icon set.
- Replaced shelf decoration emoji with custom vector plant, sparkle, candle, and coffee icons.
- Replaced action icons with matching vector icons.
- Redesigned the Reading Room brand/app icon.
- Updated the PWA/home-screen icon to use the same Reading Room brand mark.
- Removed emoji styling from format and genre dropdown option text.
- No layout, data, sync, or feature behavior was changed.


## V5.2 — Feature restoration
Restored features that were simplified or dropped during the V5 architecture rebuild:

- Favourite character
- Favourite scene
- Favourite quote
- Prediction result display
- Full Hall of Fame behavior
- Finish Book celebration behavior
- DNF Archive on the TBR page
- DNF detail/edit flow
- Reading memory cards in finished-book details
- Favourite quote display
- Existing Reading Sessions preserved
- Existing Statistics preserved
- Existing Supabase sync preserved
- Existing backup/import preserved
- Existing custom SVG icon system preserved

No storage keys or Supabase schema were changed.


## V5.2.1 — JavaScript hotfix
- Fixed malformed icon helper that prevented app JavaScript from loading.
- Restored page rendering and all button/navigation behavior.
- Added the missing dynamic genre icon helper.
- No feature, data, layout, or Supabase schema changes.


## V5.3 — Usability bug-fix release

Fixed the five reported issues:

1. **Reading progress**
   - clearer progress bar and percentage
   - displays `Page X of Y` when total pages are known
   - displays current page clearly when total pages are not set
   - session start/end pages update the current reading position

2. **Finished book details**
   - compact finished-book preview no longer contains the entire journal
   - added a dedicated `Read More` page for full thoughts, memories, quote, prediction, spoilers, sessions, and Hall of Fame status

3. **Dropdown icons**
   - removed emoji from native dropdown values and placeholders
   - mood values are now text-based
   - legacy emoji mood values remain readable through compatibility mapping

4. **Icon consistency**
   - removed remaining static emoji-style icons from statistics, filters, and dynamic finished shelves
   - continued using the custom SVG icon system

5. **Reading Sessions**
   - added Sessions button on each Currently Reading card
   - added sessions manager showing every session
   - added edit session
   - added delete session
   - session manager shows total minutes and current page
   - editing/deleting a session automatically refreshes the book progress

Existing book data, Supabase schema, automatic sync, and PWA behavior remain compatible.


## V5.3.1 — Mobile navigation + date alignment hotfix
- Restored Sync to the iPhone bottom navigation.
- Changed mobile bottom nav to a compact 6-item layout.
- Kept Add Book floating above the navigation.
- Fixed iPhone/Safari date input width and alignment.
- Forced date fields to stay inside their form card.
- Preserved all V5.3 features and data compatibility.


# V6 — Personal Reading Experience

## Book Memory Cards
Finished books can now appear as visual memory cards on the Room page.
A card can include:
- cover
- title and author
- rating
- genre
- reading duration
- favourite quote
- favourite character
- detective score when a prediction exists

## Detective Score
Prediction results now generate a score:
- Correct: 100%
- Partly right: 50%
- Not correct: 0%

Finished book details show the score and label.
Statistics now include an average yearly Detective Score.

## Shelf Decoration Customization
The Room page now has a Customize Room action.
Users can choose:
- Classic Wood
- Light Oak
- Dark Walnut

Decorations can be toggled:
- Plant
- Candle
- Coffee
- Sparkle

Decoration preferences are stored locally and do not alter book data or Supabase schema.

All V5.3.1 features, Supabase sync, Reading Sessions, PWA updates, and existing data remain compatible.


## V6.1 — Interactive Shelf Designer
- Moved Book Memory Cards from the Room page to the Finished page.
- Moved Customize Room beside the My Library heading.
- Added independent shelf customization for:
  - Room / My Library
  - TBR
  - Finished yearly shelves
- Added per-page shelf finish selection.
- Added exact-position decoration layouts.
- Desktop:
  - drag a decoration from the tray onto a shelf
  - drag placed decorations to reposition them
- iPhone / touch:
  - tap a decoration in the tray
  - tap the shelf where it should be placed
  - drag placed decorations to reposition them
- Added remove control for each placed decoration while customizing.
- Added Clear Shelf and Reset This Shelf.
- Shelf layouts persist across reloads.
- Older V6 decoration preferences are automatically migrated.
- Book data and Supabase schema are unchanged.


## V6.2.1 — Cozy Shelf Hotfix
- Rebuilt from the working V6.1 codebase after the broken V6.2 patch.
- Preserved all application helpers, routing, rendering, sync, sessions, stats, and book features.
- Removed drag/drop decoration logic.
- Removed all floating decoration icons.
- Removed top-corner decoration icons.
- Added built-in fairy lights.
- Added one fixed natural-looking plant.
- Added six shelf finishes.
- Kept independent shelf styles for Room, TBR, and Finished.
