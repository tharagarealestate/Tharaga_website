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
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((resp) => {
        const respClone = resp.clone();
        caches.open('thg-v1').then((cache) => cache.put(request, respClone));
        return resp;
      }))
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
