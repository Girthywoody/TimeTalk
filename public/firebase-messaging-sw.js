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
    // Base URL for the app
    const baseUrl = 'https://time-talk.vercel.app';
    
    // Construct the path based on the notification type
    let path = '/chat'; // Default to chat page
    let queryParams = '';

    if (event.action === 'reply') {
        queryParams = `?action=reply&messageId=${data?.messageId || ''}`;
    }

    // Combine the path and query parameters
    const urlToOpen = `${baseUrl}${path}${queryParams}`;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    })
    .then((windowClients) => {
        // Try to find an existing window/tab
        let matchingClient = null;
        
        for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            // Check if the client URL starts with our base URL
            if (client.url.startsWith(baseUrl)) {
                matchingClient = client;
                break;
            }
        }

        if (matchingClient) {
            // If we found an existing window, focus it and navigate
            return matchingClient.focus().then((client) => {
                // After focusing, navigate to the specific page
                return client.navigate(urlToOpen).then((client) => client.focus());
            });
        } else {
            // If no existing window, open a new one
            return clients.openWindow(urlToOpen);
        }
    })
    .catch((err) => {
        console.error('Error handling notification click:', err);
        // Fallback to simple window opening
        return clients.openWindow(urlToOpen);
    });

    event.waitUntil(promiseChain);
});