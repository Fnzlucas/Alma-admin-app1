const CACHE_NAME = 'alma-admin-v2';
const ASSETS = [
  './index.html',
  './manifest-admin.json'
];

// Installation
self.addEventListener('install', function(e) {
  console.log('[SW] Installation...');
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      console.log('[SW] Fichiers mis en cache');
    })
  );
  self.skipWaiting();
});

// Activation
self.addEventListener('activate', function(e) {
  console.log('[SW] Activation...');
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — Network first, fallback cache
self.addEventListener('fetch', function(e) {
  // Ignorer les requêtes Supabase (toujours en ligne)
  if (e.request.url.includes('supabase.co')) {
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(response) {
      // Mettre en cache la nouvelle version
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(e.request, clone);
      });
      return response;
    }).catch(function() {
      // Hors-ligne : utiliser le cache
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});
