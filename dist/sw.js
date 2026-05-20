const CACHE_NAME = "aubergine-v10";

// Only precache YOUR OWN files — never third-party CDN URLs.
// cache.addAll() is atomic: one CDN failure = entire SW install aborted = no install prompt.
const OWN_ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "recipes.json",
  "src/styles.css",
  "src/main.js",
  "src/js/pwa.js",
  "src/js/db.js",
  "src/js/state.js",
  "src/js/utils.js",
  "src/js/sync.js",
  "src/js/ui/actions.js",
  "src/js/ui/modals.js",
  "src/js/ui/navigation.js",
  "src/js/ui/recipes.js",
  "src/js/ui/shopping.js",
  "src/js/ui/welcome.js",
];

// CDN assets are cached opportunistically on first use — never in precache.
const CDN_ORIGINS = [
  "unpkg.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdn.tailwindcss.com",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OWN_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  const url = new URL(event.request.url);
  const isCDN = CDN_ORIGINS.some((origin) => url.hostname.includes(origin));

  if (isCDN) {
    // CDN assets: network first, fall back to cache. Never block SW install on these.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Own assets: network first, cache as fallback for offline support.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
