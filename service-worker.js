/* ==========================================
   SERVICE WORKER - Background Processing
   ========================================== */

const CACHE_NAME = 'smart-city-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/admin.html',
    '/style.css',
    '/script.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: Caching app resources');
            return cache.addAll(URLS_TO_CACHE).catch(err => {
                console.log('Service Worker: Some resources failed to cache (this is OK)', err);
                return;
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
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
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            // Return cached version if available
            if (response) {
                return response;
            }

            // Otherwise fetch from network
            return fetch(event.request).then(response => {
                // Only cache successful responses
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(err => {
                console.log('Service Worker: Fetch failed', err);
                // Return a fallback response if needed
                return new Response('Offline - Application not available', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
        })
    );
});

// Background sync - sync data when connection restored
self.addEventListener('sync', event => {
    if (event.tag === 'sync-issues') {
        event.waitUntil(
            // Sync pending issues with server (if backend exists)
            fetch('/api/issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issues: JSON.parse(localStorage.getItem('issues') || '[]')
                })
            }).then(response => {
                console.log('Service Worker: Issues synced successfully');
            }).catch(err => {
                console.log('Service Worker: Sync will retry later');
                throw err; // Retry later
            })
        );
    }
});

// Message listener - communicate with app
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('Service Worker loaded and ready for background processing');
