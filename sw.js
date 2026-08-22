/*
 * My Reading Room — Service Worker
 * Copyright © 2026 Krishna Bhatt. All rights reserved.
 */
const VERSION="reading-room-v7-0-5-copyright-footer";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  event.respondWith(fetch(event.request,{cache:"no-store"}).catch(()=>fetch(event.request)));
});
