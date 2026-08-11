// Imported into the workbox-generated service worker via
// `workbox.importScripts` (see vite.config.ts). Handles the actual Push API
// events — workbox itself only takes care of asset precaching/offline.

self.addEventListener('push', (event) => {
  let payload = { title: 'Thanzi Guide', body: '' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    data: { url: payload.url || '/' },
    tag: payload.tag, // same tag replaces an existing unread notification instead of stacking
    renotify: !!payload.tag
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// If a push subscription expires/rotates in the background, re-subscribe
// with the same VAPID key. The app will pick up and re-save the new
// subscription next time it's opened (see usePushNotifications' effect).
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription ? { applicationServerKey: event.oldSubscription.options.applicationServerKey, userVisibleOnly: true } : undefined)
      .catch(() => {})
  );
});
