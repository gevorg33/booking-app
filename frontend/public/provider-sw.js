/* Provider PWA service worker — scoped to /provider */
const CACHE = 'optischedule-provider-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['/provider/today', '/provider/login', '/icons/provider-icon.svg']),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith('/provider')) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('/provider/today'))),
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'OptiSchedule', body: 'New notification', url: '/provider/today' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* ignore */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/provider-icon.svg',
      badge: '/icons/provider-icon.svg',
      data: { url: data.url || '/provider/today' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/provider/today';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/provider') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
