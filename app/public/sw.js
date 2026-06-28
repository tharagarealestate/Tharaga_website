const CACHE_NAME = 'thg-v4';
const RUNTIME_CACHE = 'thg-runtime-v1';
const IMAGE_CACHE = 'thg-images-v1';

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/property-listing/',
  '/search-filter-home/',
  '/buyer-form/',
  '/rating/',
  '/registration/',
  '/css/brand.css',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('Precache failed for some URLs:', err);
        // Continue even if some URLs fail
        return Promise.resolve();
      });
    })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== IMAGE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't intercept requests to external CDNs and APIs - let them bypass the service worker
  const externalDomains = [
    'cdn.jsdelivr.net',
    'unpkg.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'www.gstatic.com',
    'www.google.com',
    'accounts.google.com',
    'supabase.co',
    'i.pravatar.cc',
    'r2cdn.perplexity.ai',
    'stripe.com',
    'razorpay.com',
    'api.tharaga.co.in'
  ];

  if (externalDomains.some(domain => url.hostname.includes(domain))) {
    // Let browser handle these requests directly, bypass service worker
    return;
  }

  // Enhanced caching strategies for better mobile performance
  if (request.url.includes('/api/')) {
    // API calls: Network-first with cache fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  } else if (request.destination === 'image') {
    // Images: Cache-first for better performance
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
  } else if (request.mode === 'navigate') {
    // Navigation: Network-first to avoid stale content
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('/offline.html');
          });
        })
    );
  } else {
    // Other resources: Cache-first strategy
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
  }
});

// Listen for messages to cache additional URLs (e.g., saved images)
self.addEventListener('message', (event) => {
  try{
    const data = event.data || {}
    if (data.type === 'cacheUrls' && Array.isArray(data.urls)) {
      event.waitUntil(
        caches.open('thg-v1').then((cache) => Promise.all(
          data.urls.map((u) => fetch(u, { mode: 'no-cors' }).then((res) => cache.put(u, res)).catch(()=>null))
        ))
      )
    }
  } catch(_){}
})

// Web Push: receive and display notifications
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {}
    const title = data.title || 'Notification'
    const message = data.message || ''
    const options = {
      body: message,
      icon: '/property-listing/noimg.svg',
      badge: '/property-listing/noimg.svg',
      data: { url: data.url || '/' }
    }
    event.waitUntil(self.registration.showNotification(title, options))
  } catch (_) {}
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification && event.notification.data && event.notification.data.url ? event.notification.data.url : '/'
  event.waitUntil(
    clients.openWindow(url)
  )
})