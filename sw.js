const CACHE_NAME = 'jonna-aubergine-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/recipes.json',
  '/src/styles.css',
  '/src/main.js',
  '/src/js/db.js',
  '/src/js/state.js',
  '/src/js/utils.js',
  '/src/js/ui/actions.js',
  '/src/js/ui/modals.js',
  '/src/js/ui/navigation.js',
  '/src/js/ui/recipes.js',
  '/src/js/ui/shopping.js',
  'https://unpkg.com/dexie/dist/dexie.js',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@1,700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request).catch(() => {
            // Fallback for offline if needed, but for now just let it fail naturally 
            // if not in cache and no network
        });
      })
  );
});
