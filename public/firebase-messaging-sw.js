// Clear any existing cache on activation
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cache => {
                        return caches.delete(cache);
                    })
                );
            })
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

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/ios-icon-192.png',
        badge: '/ios-icon-192.png',
        tag: payload.data?.timestamp || Date.now().toString(),
        data: payload.data || {},
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});


// Handle push events directly (important for iOS)
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push received:', event);

    if (event.data) {
        try {
            let payload;
            try {
                payload = event.data.json();
            } catch (e) {
                // If not JSON, try text
                const text = event.data.text();
                try {
                    payload = JSON.parse(text);
                } catch (e2) {
                    // Use text as is
                    payload = {
                        notification: {
                            title: 'New Notification',
                            body: text
                        }
                    };
                }
            }
            
            console.log('[Service Worker] Push payload:', payload);

            const notificationTitle = payload.notification?.title || 'New Message';
            const notificationOptions = {
                body: payload.notification?.body || 'You have a new notification',
                icon: '/ios-icon-192.png',
                badge: '/ios-icon-192.png',
                tag: payload.data?.timestamp || Date.now().toString(),
                data: payload.data || {},
                actions: [{
                    action: 'open',
                    title: 'Open'
                }],
                renotify: true,
                requireInteraction: true,
                silent: false
            };

            event.waitUntil(
                self.registration.showNotification(notificationTitle, notificationOptions)
            );
        } catch (error) {
            console.error('[Service Worker] Error handling push event:', error);
        }
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click received:', event);

    event.notification.close();

    const clickAction = event.notification.data?.clickAction || '/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            for (const client of clientList) {
                if (client.url === clickAction && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(clickAction);
            }
        })
    );
});



self.addEventListener('error', function(event) {
    console.error('[firebase-messaging-sw.js] Error:', event.error);
});