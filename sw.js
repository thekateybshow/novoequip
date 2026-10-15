// Service Worker for NE Equipment Tracker
// index.html is network-first, so you do NOT need to change this file when you update it.
// Only bump VERSION if you want to force all devices to clear their caches.
var VERSION = 'ne-tracker-v2';

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
  var url = new URL(e.request.url);

  // Only handle GET requests for our own site.
  // Supabase / API calls (other origins) go straight to the network, never cached,
  // so cloud sync always sees live data.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

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

  // For our own static files (images, scripts) - cache first, only cache good responses
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(VERSION).then(function(cache) {
            cache.put(e.request, copy);
          });
        }
        return response;
      });
    })
  );
});
