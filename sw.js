// Service Worker for NE Equipment Tracker
// Increment version number every time you upload a new index.html
var VERSION = 'ne-tracker-v1';

self.addEventListener('install', function(e) {
  // Skip waiting so new SW activates immediately
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  // Clear old caches when new version activates
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== VERSION; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  // For the main HTML file - always try network first, fall back to cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(function(response) {
          // Cache the fresh version
          var copy = response.clone();
          caches.open(VERSION).then(function(cache) {
            cache.put(e.request, copy);
          });
          return response;
        })
        .catch(function() {
          // Network failed - serve from cache
          return caches.match(e.request);
        })
    );
    return;
  }
  // For everything else (images, scripts) - cache first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        caches.open(VERSION).then(function(cache) {
          cache.put(e.request, response.clone());
        });
        return response;
      });
    })
  );
});
