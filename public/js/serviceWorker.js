// this is the name of the cashem
// its stored here for easy access
const staticSpotifyDashboard = "dev-spotify-dashboard-v1"

// TODO: Add more assets to cache
const assets = [
  "/app/app.html",
  "/app/playlists.html",
  "/app/search.html",
  "/app/settings.html",
  "/app/404.html",
  "/public/css/app.css",
  "/public/js/app.js",
  "/public/js/serviceWorker.js",
  "/public/img/icons/favicon.ico", // should not be needed, it downloads the one from the manifest
]

/**
 * This is run after the first install, this will fetch everything in the assets dict and cache it.
 * This is run only once, when the service worker is installed.
 * If you want to update the cache, you need to change the staticSpotifyDashboard variable.
 */
self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticSpotifyDashboard).then(cache => {
      cache.addAll(assets)
    })
  )
})

/**
 * This is run when the service tries to fetch a resource.
 * It will first check if the resource is in the cache, if it is, it will return it.
 * If it is not in the cache, it will fetch it from the network.
 */
self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request)
    })
  )
})


// TODO: check if this is needed
// /**
//  * This is run when the service worker is activated.
//  * It will delete any old caches that are not in the staticSpotifyDashboard variable.
//  */
// self.addEventListener("activate", activateEvent => {
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