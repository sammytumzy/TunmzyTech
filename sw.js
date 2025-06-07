// Service Worker for TumzyTech - Caching and offline support

const CACHE_NAME = 'tumzytech-v1.2.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/chat.html',
  '/assets/css/styles.css',
  '/assets/js/scripts.js',
  '/assets/js/chat.js',
  '/assets/js/pi-payments.js',
  '/assets/js/error-handler.js',
  '/assets/pictures/aihelphuman.jpg',
  '/assets/pictures/favicon/favicon.ico',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.9.6/lottie.min.js'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.error('Service Worker: Failed to cache files', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Pi SDK requests to avoid interference
  if (event.request.url.includes('minepi.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }

        return fetch(event.request).then(function(response) {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(function(error) {
          console.log('Service Worker: Fetch failed, serving fallback', error);
          
          // Serve fallback for HTML pages
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          // Serve fallback for images
          if (event.request.destination === 'image') {
            return new Response(
              `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#9333ea"/>
                <text x="100" y="100" text-anchor="middle" dy=".3em" fill="white" font-size="60">🤖</text>
              </svg>`,
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        });
      })
  );
});

// Handle background sync for offline functionality
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Placeholder for background sync functionality
  return Promise.resolve();
}

// Handle push notifications (future feature)
self.addEventListener('push', function(event) {
  console.log('Service Worker: Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update from TumzyTech!',
    icon: '/assets/pictures/favicon/favicon.ico',
    badge: '/assets/pictures/favicon/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/assets/pictures/favicon/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/pictures/favicon/favicon.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('TumzyTech', options)
  );
});
