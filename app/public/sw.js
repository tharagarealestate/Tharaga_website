self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('thg-v1').then((cache) => cache.addAll([
      '/',
      '/property-listing/',
      '/search-filter-home/',
      '/buyer-form/',
      '/rating/',
      '/registration/',
      '/css/brand.css',
      '/manifest.webmanifest'
    ]))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== 'thg-v1' ? caches.delete(k) : Promise.resolve())))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Network-first for API; cache-first for static and pages
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
  } else {
    event.respondWith((async () => {
      const cached = await caches.match(request)
      if (cached) return cached
      try {
        const resp = await fetch(request)
        const clone = resp.clone()
        const cache = await caches.open('thg-v1')
        cache.put(request, clone)
        return resp
      } catch (e) {
        // Navigation fallback
        if (request.mode === 'navigate') {
          const off = await caches.match('/offline.html')
          if (off) return off
        }
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
