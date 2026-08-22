# My Reading Room — Troubleshooting

## Cloud sync active but another device is stale

- Confirm both devices use the same Firebase account.
- Use **Sync Now** on the stale device.
- Confirm the book/document exists in Firestore under the same UID.
- Avoid making conflicting offline edits on both devices until the baseline is restored.

## Login fails

- Confirm Email/Password is enabled in Firebase Authentication.
- Confirm the account exists.
- Confirm the deployed host is listed in Authentication Authorized domains.
- Confirm API-key referrer restrictions include the host being used.

## Permission denied / Firestore 403

Review Firestore Rules. The active user's UID must match the `users/{uid}` path being accessed.

## GitHub secret-scanning warning for Firebase Web API key

GitHub may flag a Firebase Web API key because it matches a Google API-key pattern. Do not confuse it with a service-account private key. Keep Firestore Rules locked down and apply API/referrer restrictions. Never dismiss an alert for an actual Admin/service-account secret.

## Cover remains too large

The accepted lifetime policy is **under 10 KB**. If a source image cannot be reduced below the hard limit, the app should continue compression or reject it instead of storing a larger cover.

## Cover looks poor

The current policy resizes first and then selects the highest WebP quality that fits under 10 KB. Replace an older over-compressed cover from the original source to regenerate it with the adaptive quality-first policy.

## Calendar date looks wrong

Reading Calendar data comes from Reading Sessions. Open the session and verify its stored Session Date rather than looking for separate calendar records.

## Room TBR count differs from TBR page

Both pages should use the same complete TBR collection in V7. If they differ, refresh after sync and verify the current deployed build/service worker is up to date.

## Old build appears after deployment

Hard refresh, fully close/reopen the installed PWA, or clear the site's service-worker/cache data if a previous build still controls the page.

---

Copyright © 2026 Krishna Bhatt. All rights reserved.
