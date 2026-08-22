# My Reading Room — Deployment Guide

## Static deployment

My Reading Room is a static web/PWA project. The repository root contains the files required for a GitHub Pages-style deployment.

## Pre-deployment

1. Validate JavaScript syntax.
2. Confirm `manifest.webmanifest` is valid JSON.
3. Confirm `firebase-config.js` contains only Firebase Web client configuration.
4. Confirm Firestore Security Rules are published.
5. Confirm Firebase Authentication has the production domain authorized.
6. Confirm the Google API key has appropriate API/referrer restrictions.
7. Make a Reading Room JSON backup before replacing an existing production build.

## Local test

From the project root:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000` and run the release checklist.

## GitHub Pages

Deploy the repository through GitHub Pages using the branch/path configured for the project. After deployment, hard refresh once if an older service worker is still controlling the page.

## Firebase domains

Authentication Authorized domains should contain the host (for example `kbhatt-dev.github.io`), not the GitHub repository URL. API-key HTTP referrer restrictions can include the deployed origin and explicit localhost development origins.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
