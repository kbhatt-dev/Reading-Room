# My Reading Room — V5

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
