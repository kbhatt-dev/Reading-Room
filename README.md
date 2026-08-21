# My Reading Room — V1

A cozy, mobile-friendly personal reading journal and digital bookshelf.

## Included in V1
- Add, edit and delete books
- Upload book cover images
- Status: Want to Read / Reading / Finished / DNF
- Currently Reading cards with page progress
- Decorative bookshelf landing page
- Half-star ratings from 0.5 to 5
- Review / thoughts
- Story memory with spoiler reveal
- Favourite character, scene and quote
- Prediction/theory + result
- Search by title, author or genre
- Filter by reading status
- Responsive layout for phone and desktop
- PWA manifest + service worker so it can be added to an iPhone home screen
- LocalStorage persistence

## Important V1 note
Data is stored in the browser on that device. If you open the app on another phone/computer,
the books will not automatically sync yet. Cloud/database sync can be added in V2.

## Run locally
Because the service worker requires HTTP/HTTPS, use a simple local server instead of opening
index.html directly.

Python:
    python -m http.server 8000

Then visit:
    http://localhost:8000

## Put it online
Deploy this folder to any static host such as GitHub Pages, Netlify, Vercel, or Cloudflare Pages.

## iPhone
Once hosted on HTTPS:
1. Open the website in Safari.
2. Tap Share.
3. Choose "Add to Home Screen".
4. Launch it from the new Reading Room icon.


## V1.1 update
- Genre is now a dropdown instead of free text.
- Added a Genre Manager to add, rename, and delete custom genres.
- Renaming a genre updates existing books using that genre.
- Deleting a genre removes it from future choices without deleting books.
- Replaced the large mobile file input with a compact "Choose Cover" button.
- Reduced the cover preview size on phones.


# V2

## New in V2
- Added Library / Statistics / Sync navigation.
- Added yearly bookshelves based on finished/start date.
- Added genre filter beside search and status filters.
- Added Reading Statistics dashboard:
  - finished books
  - pages read
  - average rating
  - top genre
  - books by month
  - genre breakdown
  - rating breakdown
  - format breakdown
- Added JSON backup export and restore.
- Added optional Supabase sync configuration.
- Local-only mode still works without any account or backend.

## Optional Supabase cloud sync setup

Create a Supabase project and add this table:

```sql
create table reading_room_sync (
  user_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at_ms bigint not null default 0
);
```

For a private personal project, configure appropriate Row Level Security policies before using it publicly.

Then open Reading Room → Sync and enter:
- Project URL
- anon public key
- your private Sync ID

Use the same values on your iPhone and computer.

Important: V2 does not ship with anyone's credentials.


## V2.1 — Secure authenticated device sync

Cloud sync now uses Supabase Authentication instead of a manually chosen Sync ID.

### Required Supabase setup
The `reading_room_sync` table should use:

```sql
create table reading_room_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at_ms bigint not null default 0
);

alter table reading_room_sync enable row level security;
```

RLS policies:

```sql
create policy "Users can read their own reading room"
on reading_room_sync for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own reading room"
on reading_room_sync for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own reading room"
on reading_room_sync for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own reading room"
on reading_room_sync for delete to authenticated
using ((select auth.uid()) = user_id);
```

### In the app
1. Open **Sync**.
2. Paste your Supabase **Project URL**.
3. Paste your **Publishable key** (`sb_publishable_...`).
4. Click **Save Connection**.
5. Enter the email/password for the user created in Supabase Authentication.
6. Click **Sign In & Sync**.
7. Use the same Project URL, Publishable key, email and password on your second device.

The app does not store your password. Supabase session tokens are kept locally so you stay signed in.

### Sync behavior
- Books still save immediately to localStorage.
- When signed in, changes are also synced to Supabase.
- A new device downloads the newest cloud copy.
- The **Sync Now** button is available for a manual refresh.
- JSON export/import backup remains available.


## V2.2 — Automatic sync + mobile form refresh

- Cloud sync now runs automatically:
  - after book/genre changes
  - when the app starts
  - when the browser/app returns to focus
  - when the device comes back online
  - every 60 seconds while the app is visible
- Manual "Sync Now" remains as an optional fallback.
- Added a floating Add Book button on mobile.
- Reworked Add Book into visual sections.
- Added sticky mobile Save Book action.
- Prevented iPhone Safari input-focus zoom with 16px form controls.
- Added emoji-enhanced format and genre choices.
- Improved mobile full-screen book editor.
- Kept existing book data format compatible with earlier versions.


## V2.3 — Automatic app updates

This release fixes stale GitHub Pages / iPhone Home Screen builds.

Changes:
- Removed persistent service-worker app-shell caching.
- The service worker now activates immediately with `skipWaiting()`.
- Old Reading Room caches are automatically deleted during activation.
- The app registers the service worker with `updateViaCache: "none"`.
- Reading Room checks for a new service worker on launch and when returning to the app.
- When a new build takes control, the page reloads once automatically.
- You should no longer need Chrome DevTools → Application → Clear site data for normal releases.
- Supabase/localStorage data are not cleared during an app update.

Note:
The very first upgrade from an older aggressively cached build may still require one hard refresh
or reopening the installed app because the *old* service worker is the code currently controlling it.
After V2.3 is installed, future releases use the new automatic update behavior.
