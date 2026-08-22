const VERSION="reading-room-v7-0-1-firebase-config";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  event.respondWith(fetch(event.request,{cache:"no-store"}).catch(()=>fetch(event.request)));
});
