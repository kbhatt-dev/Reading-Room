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
