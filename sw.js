const SW_VERSION = "reading-room-v3";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  // Network-first/no persistent app-shell cache.
  // If offline, the browser's normal HTTP cache may still help, but this service worker
  // will never intentionally serve an old Reading Room build.
  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .catch(() => fetch(event.request))
  );
});
