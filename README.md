# My Reading Room — V5

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
