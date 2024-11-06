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

// Keep track of displayed notifications to prevent duplicates
const displayedNotifications = new Set();

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Clear old displayed notifications on activation
            displayedNotifications.clear()
        ])
    );
});

// Handle push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        if (!data.notification) return;

        // Generate a unique ID for the notification
        const notificationId = `${data.data?.messageId || Date.now()}-${data.notification.title}`;
        
        // Check if this notification has already been displayed
        if (displayedNotifications.has(notificationId)) {
            console.log('Duplicate notification prevented:', notificationId);
            return;
        }

        // Add to displayed notifications set
        displayedNotifications.add(notificationId);

        // Clear old notifications after 1 minute
        setTimeout(() => {
            displayedNotifications.delete(notificationId);
        }, 60000);

        const notificationOptions = {
            ...data.notification,
            icon: '/ios-icon-192.png',
            badge: '/ios-icon-192.png',
            tag: notificationId,
            data: data.data || {},
            requireInteraction: true,
            actions: [
                {
                    action: 'reply',
                    title: 'Reply'
                },
                {
                    action: 'mark-read',
                    title: 'Mark as Read'
                }
            ]
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

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'reply') {
        const urlToOpen = new URL('/chat?action=reply', self.location.origin).href;
        event.waitUntil(clients.openWindow(urlToOpen));
        return;
    }

    if (event.action === 'mark-read') {
        // Mark message as read and close notification
        return;
    }

    const urlToOpen = new URL('/chat', self.location.origin).href;

    const promiseChain = clients.matchAll({
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
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});