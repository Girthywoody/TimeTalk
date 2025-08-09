// Clear any existing cache on activation
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames =>
        Promise.all(cacheNames.map(cache => caches.delete(cache)))
      )
    ])
  );
});

// Initialize Firebase
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDdFtxNbwQSYGfO3pUKG8hkkxlwhlikvQQ",
  authDomain: "timetalk-13a75.firebaseapp.com",
  projectId: "timetalk-13a75",
  storageBucket: "timetalk-13a75.appspot.com",
  messagingSenderId: "676555846687",
  appId: "1:676555846687:web:918431d0810a41980b512a"
});

const messaging = firebase.messaging();

// ---- Deduping helpers ----

// Track recently shown notifications to avoid rapid duplicates
const recentNotificationTags = new Set();

// Build a sane tag from available data
function buildTagFromOptions(options) {
  if (options?.tag) return String(options.tag);
  // Fallback: try to synthesize a tag from body + timestamp
  const base = options?.body || Math.random().toString(36).slice(2);
  return `${Date.now()}-${base.slice(0, 24)}`;
}

// Helper to avoid showing the same notification multiple times
async function showUniqueNotification(title, options = {}) {
  const tag = buildTagFromOptions(options);
  options.tag = tag; // ensure tag is set for registration lookup

  // In-memory short-term dedupe (30s)
  if (recentNotificationTags.has(tag)) {
    console.log('[SW] Duplicate notification skipped (tag in memory):', tag);
    return;
  }
  recentNotificationTags.add(tag);
  setTimeout(() => recentNotificationTags.delete(tag), 30000);

  // Registration-level dedupe
  const existing = await self.registration.getNotifications({ tag });
  if (!existing || existing.length === 0) {
    return self.registration.showNotification(title, options);
  }
  console.log('[SW] Duplicate notification skipped (existing with same tag):', tag);
}

// ---- Firebase background message handler ----
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Message';

  const notificationTag =
    payload.data?.id ||
    payload.data?.messageId ||
    payload.data?.timestamp ||
    undefined;

  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/ios-icon-192.png',
    badge: '/ios-icon-192.png',
    tag: notificationTag,
    data: { ...(payload.data || {}), tag: notificationTag },
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200]
  };

  showUniqueNotification(notificationTitle, notificationOptions);
});

// ---- Notification click handling ----
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received:', event);
  event.notification.close();

  const clickAction = event.notification.data?.clickAction || '/';
  const notificationData = event.notification.data || {};

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          client.postMessage({
            type: 'notificationClick',
            notification: { data: notificationData }
          });
          return client.focus();
        }
      }
      // If no client found, open a new one
      return clients.openWindow(clickAction);
    })
  );
});

// ---- Raw push event (useful for iOS/Safari quirks) ----
self.addEventListener('push', function(event) {
  const now = Date.now();
  const lastPushTimestamp = self.lastPushTimestamp || 0;

  // Ignore pushes that arrive within 2 seconds of each other
  if (now - lastPushTimestamp < 2000) {
    console.log('[Service Worker] Ignoring duplicate push notification');
    return;
  }
  self.lastPushTimestamp = now;

  console.log('[Service Worker] Push received:', event);

  if (event.data) {
    event.waitUntil((async () => {
      try {
        let payload;
        try {
          payload = event.data.json();
        } catch {
          const text = event.data.text();
          try {
            payload = JSON.parse(text);
          } catch {
            payload = { notification: { title: 'New Notification', body: text } };
          }
        }

        console.log('[Service Worker] Push payload:', payload);

        const notificationTitle = payload.notification?.title || 'New Message';
        const notificationTag =
          payload.data?.id ||
          payload.data?.messageId ||
          payload.data?.timestamp ||
          undefined;

        const notificationOptions = {
          body: payload.notification?.body || 'You have a new notification',
          icon: '/ios-icon-192.png',
          badge: '/ios-icon-192.png',
          tag: notificationTag,
          data: { ...(payload.data || {}), tag: notificationTag },
          actions: [{ action: 'open', title: 'Open' }],
          renotify: true,
          requireInteraction: true,
          silent: false
        };

        await showUniqueNotification(notificationTitle, notificationOptions);
      } catch (error) {
        console.error('[Service Worker] Error handling push event:', error);
      }
    })());
  }
});

// ---- Global error logging ----
self.addEventListener('error', function(event) {
  console.error('[firebase-messaging-sw.js] Error:', event.error);
});
