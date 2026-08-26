# My Reading Room — Project Overview

## Purpose

**My Reading Room** is a personal, local-first web/PWA reading journal designed for long-term use across desktop and iPhone. It combines a cozy digital bookshelf with reading tracking, sessions, journal memories, goals, search, statistics, backup tools, offline use, and Firebase cloud synchronization.

## Final release line

- Release family: **V7 — Firebase Lifetime Release**
- Current release: **V7.0.11 — Final UI & Audiobook Polish**
- Documentation/ownership package: **V7.0.11**
- Front end: HTML, CSS, vanilla JavaScript
- Hosting target: static hosting such as GitHub Pages
- Cloud backend: Firebase Authentication + Cloud Firestore
- Offline/local persistence: browser localStorage with PWA support
- Cover policy: adaptive quality-first WebP, **strictly below 10 KB** when accepted

## Main pages

- **Room** — recent finished books and the complete Next on TBR shelf.
- **TBR** — searchable/filterable to-be-read library.
- **Reading** — current progress, predictions/theories and Reading Sessions.
- **Finished** — completed-book library and detailed reading journal/memory view.
- **Stats** — reading totals, streaks, goals, achievements and monthly Reading Calendar.
- **Sync** — Firebase status, manual sync, backup/export/import, storage information and protected reset.

## Important features

Books can store status, author, genre, format, cover, dates, format-aware progress (pages for standard books, HH:MM:SS time for audiobooks), sessions, predictions, journal thoughts, rating, favourite character/scene/quote, story memories and Hall of Fame/favourite-book data. The app also includes custom genres, shelf themes, yearly reading goals, monthly challenges, achievements, random TBR selection, advanced search, JSON backup/import and a human-readable Reading Journal export.

## Product principles

The final project prioritizes **reliability → mobile usability → data safety → performance**. The app intentionally avoids unnecessary cloud-synced UI state, large cover images and decorative feature creep. The cozy/elegant bookshelf design, line-style icons, fairy lights/leaves and mobile bottom navigation are preserved.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
