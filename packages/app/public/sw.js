/**
 * P23: the service worker.
 *
 * One rule: every asset is served from the cache first, and the network is never required. The
 * application is a calculator with its data already inside it, so there is nothing to be fresh
 * about. Principle P10 states that offline is the default rather than the fallback, and this file
 * is where the web build honours that.
 *
 * The precache list is written at build time by the manifest plugin in vite.config.ts, so it
 * covers the whole shell rather than whatever happened to be requested on a first visit. The cache
 * name carries the build hash, so a new build replaces the old cache wholesale instead of leaving
 * a half-updated mixture of two builds behind.
 */

const CACHE = 'metrika-__BUILD_ID__';
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // addAll is atomic: if one entry fails the install fails, and a half-populated cache that
      // looks complete is worse than no cache at all.
      await cache.addAll(PRECACHE);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('metrika-') && name !== CACHE)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only GET is cacheable, and the application issues nothing else.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // A cross-origin request would be a defect: the application has no third-party asset and makes no
  // API call. Refusing it here means a dependency that started reaching out would break loudly in
  // development rather than quietly phone home in production.
  if (url.origin !== self.location.origin) {
    event.respondWith(Response.error());
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached !== undefined) return cached;

      // A navigation to any path is the single page application shell.
      if (request.mode === 'navigate') {
        const shell = await caches.match('./index.html', { ignoreSearch: true });
        if (shell !== undefined) return shell;
      }

      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        // Offline and not in the cache. Answer with a status rather than a browser error page, so
        // the caller sees a refusal it can report.
        return new Response('', { status: 504, statusText: 'Offline and not cached' });
      }
    })(),
  );
});
