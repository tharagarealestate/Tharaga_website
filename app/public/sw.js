const CACHE_NAME = 'thg-v3';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      '/',
      '/property-listing/',
      '/search-filter-home/',
      '/buyer-form/',
      '/rating/',
      '/registration/',
      '/css/brand.css',
      '/manifest.webmanifest',
      '/offline.html'
    ]))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
  );
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

  // Network-first for API; cache-first for static and pages
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
  } else if (request.mode === 'navigate') {
    // Always try network first for navigation requests (HTML pages) to avoid stale content
    event.respondWith((async () => {
      try {
        const resp = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, resp.clone());
        return resp;
      } catch (e) {
        const cached = await caches.match(request);
        if (cached) return cached;
        const off = await caches.match('/offline.html');
        if (off) return off;
        throw e;
      }
    })());
  } else {
    event.respondWith((async () => {
      const cached = await caches.match(request)
      if (cached) return cached
      try {
        const resp = await fetch(request)
        const clone = resp.clone()
        const cache = await caches.open(CACHE_NAME)
        cache.put(request, clone)
        return resp
      } catch (e) {
        // Navigation fallback
        // Non-navigation: just rethrow
        throw e
      }
    })())
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