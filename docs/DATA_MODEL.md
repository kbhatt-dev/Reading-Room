# My Reading Room — Data Model

## Book

A book is the central domain object. Depending on status and user input it can include:

- id, title, author
- status: TBR / Reading / Finished / DNF
- genre and format
- optimized cover data and cover metadata
- start/finish dates
- current page and total pages
- Reading Sessions
- predictions/theories and prediction result
- rating and journal thoughts
- favourite character, favourite scene and favourite quote
- story memory
- Hall of Fame/favourite-book flag

## Reading Session

A Reading Session belongs to a book and stores the session date, minutes, start page, end page and mood. The monthly Reading Calendar is calculated from these session objects.

## Shared settings

`users/{uid}/settings/app` stores small shared configuration such as:

- custom genres
- shelf themes/customization
- yearly reading goals
- monthly challenges

## Deletion markers

`users/{uid}/deletions/{bookId}` records cross-device deletion intent so stale clients do not recreate a removed book.

## Local browser keys

The app uses namespaced browser keys for books, genres, goals, shelf decoration/theme settings, Firebase session/config helper state, sync baselines/timestamps and backup reminders. These keys are implementation details and can evolve without changing the user-facing data model.

## Cover storage policy

Covers are embedded in book data as tiny optimized images. The lifetime policy uses display-oriented resizing and chooses the highest WebP quality that fits **under 10 KB**. Existing covers already below the limit are not repeatedly degraded.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
