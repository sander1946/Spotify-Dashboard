// TODO: enable this when the app is ready for offline use
// const staticSpotifyDashboard = "dev-spotify-dashboard-v1";

// const assets: string[] = [
//   "/app/app.html",
//   "/app/playlists.html",
//   "/app/search.html",
//   "/app/settings.html",
//   "/app/404.html",
//   "/public/css/app.css",
//   "/public/js/app.js",
//   "/public/js/serviceWorker.js",
//   "/public/img/icons/favicon.ico",
// ];

// self.addEventListener("install", (installEvent: any) => {
//   installEvent.waitUntil(
//     caches.open(staticSpotifyDashboard).then(cache => {
//       return cache.addAll(assets);
//     })
//   );
// });

// self.addEventListener("fetch", (fetchEvent: any) => {
//   fetchEvent.respondWith(
//     caches.match(fetchEvent.request).then(res => {
//       return res || fetch(fetchEvent.request);
//     })
//   );
// });

// TODO: check if this is needed
// /**
//  * This is run when the service worker is activated.
//  * It will delete any old caches that are not in the staticSpotifyDashboard variable.
//  */
// self.addEventListener("activate", (activateEvent: ExtendableEvent) => {
//   activateEvent.waitUntil(
//     caches.keys().then(cacheNames => {
//       return Promise.all(
//         cacheNames
//           .filter(cacheName => cacheName !== staticSpotifyDashboard)
//           .map(cacheName => caches.delete(cacheName))
//       )
//     })
//   )}
// )

export {};
