importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDdFtxNbwQSYGfO3pUKG8hkkxlwhlikvQQ",
    authDomain: "timetalk-13a75.firebaseapp.com",
    projectId: "timetalk-13a75",
    storageBucket: "timetalk-13a75.appspot.com",
    messagingSenderId: "676555846687",
    appId: "1:676555846687:web:918431d0810a41980b512a",
    measurementId: "G-4JRNMJ99HS"
});

const messaging = firebase.messaging();

self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            self.skipWaiting(),
            // Clean up old caches here if needed
        ])
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Clean up old caches here if needed
        ])
    );
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        if (!data.notification) return;

        // Create a unique tag based on messageId and timestamp
        const tag = `${data.data?.messageId || 'default'}-${Date.now()}`;

        const notificationOptions = {
            ...data.notification,
            icon: '/ios-icon-192.png',
            badge: '/ios-icon-192.png',
            tag: tag,
            data: data.data || {},
            renotify: false,
            requireInteraction: true,
            silent: false
        };

        event.waitUntil(
            self.registration.showNotification(
                data.notification.title,
                notificationOptions
            )
        );
    } catch (error) {
        console.error('Error showing notification:', error);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const urlToOpen = new URL('/chat', self.location.origin).href;
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(urlToOpen);
        })
    );
});