// FTOS service worker — офлайн через runtime-кеш (stale-while-revalidate).
// Після першого відкриття застосунок працює без мережі: повертаємо з кешу,
// у фоні оновлюємо. Дані-довідник (JSON) вшиті у бандл, тож кешуються разом з ним.

const CACHE = 'ftos-runtime-v3';

// App shell — усі маршрути precache-имо на install, щоб офлайн працював навіть
// для сторінок, які технік ще не відкривав (HTML; JS-чанки далі ловить SWR нижче).
const PRECACHE = [
  '/',
  '/diagnose',
  '/wiring',
  '/connect',
  '/journal',
  '/batteries',
  '/firmware',
  '/recipes',
  '/boards',
  '/checklist',
  '/verify',
  '/reference',
  '/help',
  '/manifest.webmanifest',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Кожен маршрут окремо: один збій не валить увесь precache.
      await Promise.allSettled(PRECACHE.map((u) => cache.add(u)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);

      // Є кеш → віддаємо одразу, мережу оновлюємо у фоні (stale-while-revalidate).
      if (cached) {
        event.waitUntil(
          fetch(request)
            .then((response) => {
              if (response && response.status === 200 && response.type === 'basic') {
                return cache.put(request, response.clone());
              }
            })
            .catch(() => {}),
        );
        return cached;
      }

      // Кешу немає → пробуємо мережу; за офлайну даємо чесний фолбек, не undefined.
      try {
        const response = await fetch(request);
        if (response && response.status === 200 && response.type === 'basic') {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        if (request.mode === 'navigate') {
          const shell = await cache.match('/');
          if (shell) return shell;
        }
        return Response.error();
      }
    })(),
  );
});
