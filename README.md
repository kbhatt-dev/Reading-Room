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
