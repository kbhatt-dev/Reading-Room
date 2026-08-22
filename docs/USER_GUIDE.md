# My Reading Room — User Guide

## Getting around

Use the main navigation to move between Room, TBR, Reading, Finished, Stats and Sync. On mobile, use the bottom navigation. **Add Book** remains the main entry point for adding a new title.

## Adding a book

Open **Add Book**, enter the title and optional author, choose a status, genre and format, then optionally select a cover. The form shows status-specific fields only when they are relevant. Covers are converted to a tiny WebP representation before they are stored.

## TBR

Use TBR for books you plan to read. Search and genre filtering operate on the saved TBR collection. The Room page's **Next on TBR** shelf reflects the same saved TBR data rather than a separate list.

## Currently Reading

A Reading book can track current page/total pages and Reading Sessions. A session stores its date, minutes, start page, end page and mood. Sessions can be added, edited or deleted from the book and from the monthly Reading Calendar.

## Finished books and journal

Finished books support rating, finished date, thoughts, favourite character, favourite scene, favourite quote, prediction result, story memory and Hall of Fame/favourite-book status. The Finished page keeps concise shelf cards while the full journal remains available through the detailed view.

## Stats and calendar

Stats summarizes the library and reading activity. The monthly Reading Calendar is derived from Reading Sessions; it does not maintain a second set of calendar records. Select a date to view, add, edit or delete that day's sessions.

## Search

Advanced Search can find books across statuses and can filter special data such as Hall of Fame entries.

## Goals and challenges

Yearly Reading Goals and monthly challenges are persistent reading data and synchronize with the signed-in Firebase profile.

## Sync

The Sync page shows whether cloud sync is active and which Firebase account is signed in. Use **Sync Now** when you want an immediate reconciliation. Normal app changes also mark meaningful persistent data for cloud synchronization.

## Backups

Use JSON export for a machine-restorable backup. Use the Reading Journal export for a human-readable archive. Keep periodic copies outside the browser, especially before major updates or a Reset Reading Data operation.

## Reset Reading Data

The protected reset clears Reading Room library data locally and removes the corresponding Reading Room documents from Firestore while preserving the Firebase Authentication profile. Always export a backup first if the data matters.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
