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

        const notificationId = `${data.data?.type || 'default'}-${Date.now()}`;
        
        if (displayedNotifications.has(notificationId)) {
            console.log('Duplicate notification prevented:', notificationId);
            return;
        }

        displayedNotifications.add(notificationId);
        setTimeout(() => displayedNotifications.delete(notificationId), 60000);

        const notificationOptions = {
            ...data.notification,
            icon: '/ios-icon-192.png',
            badge: '/ios-icon-192.png',
            tag: notificationId,
            data: data.data || {},
            requireInteraction: true,
            vibrate: [100, 50, 100],
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

        // For message notifications, add sound
        if (data.data?.type === 'message') {
            notificationOptions.silent = false;
            notificationOptions.sound = '/sounds/notification.mp3';
        }

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

    const data = event.notification.data;
    let urlToOpen = 'https://time-talk.vercel.app/chat';

    if (data?.link) {
        urlToOpen = data.link;
    }

    if (event.action === 'reply') {
        urlToOpen = `${urlToOpen}?action=reply&messageId=${data?.messageId || ''}`;
    }

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
        return clients.openWindow(urlToOpen);
    });

    event.waitUntil(promiseChain);
});