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
    console.log('Service Worker installing.');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.');
    event.waitUntil(self.clients.claim());
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/ios-icon-192.png',
        badge: '/ios-icon-192.png',
        tag: payload.data?.tag || 'default',
        data: payload.data || {},
        vibrate: [100, 50, 100],
        requireInteraction: true,
        actions: [
            {
                action: 'open',
                title: 'Open Chat'
            }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    event.notification.close();

    const urlToOpen = new URL('/chat', self.location.origin).href;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    })
    .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            // If so, just focus it.
            if (client.url === urlToOpen && 'focus' in client) {
                return client.focus();
            }
        }
        // If not, then open the target URL in a new window/tab.
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});

self.addEventListener('push', (event) => {
    console.log('Push received:', event);
    if (!event.data) return;

    try {
        const data = event.data.json();
        const notificationTitle = data.notification.title;
        const notificationOptions = {
            body: data.notification.body,
            icon: '/ios-icon-192.png',
            badge: '/ios-icon-192.png',
            vibrate: [100, 50, 100],
            requireInteraction: true,
            data: data.data || {},
            actions: [
                {
                    action: 'open',
                    title: 'Open Chat'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(notificationTitle, notificationOptions)
        );
    } catch (error) {
        console.error('Error showing notification:', error);
    }
});