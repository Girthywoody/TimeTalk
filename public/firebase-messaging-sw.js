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

// Keep track of displayed notifications to prevent duplicates
const displayedNotifications = new Set();

// Update the background message handler
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    // Create a unique ID for the notification
    const notificationId = payload.data?.timestamp || Date.now().toString();

    // Check if we've already shown this notification
    if (displayedNotifications.has(notificationId)) {
        console.log('Duplicate notification prevented:', notificationId);
        return;
    }

    // Add to set of displayed notifications
    displayedNotifications.add(notificationId);

    // Clear old notifications from the set after 5 seconds
    setTimeout(() => {
        displayedNotifications.delete(notificationId);
    }, 5000);

    const notificationOptions = {
        body: payload.notification.body,
        icon: '/ios-icon-192.png',
        badge: '/ios-icon-192.png',
        vibrate: [100, 50, 100],
        data: payload.data,
        tag: notificationId, // Add a tag to group similar notifications
        renotify: false, // Prevent renotification for the same tag
        actions: [
            {
                action: 'open',
                title: 'Open'
            }
        ]
    };

    return self.registration.showNotification(
        payload.notification.title,
        notificationOptions
    );
});

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
        const payload = event.data.json();
        const options = {
            body: payload.notification.body,
            icon: '/ios-icon-192.png',
            badge: '/ios-icon-192.png',
            vibrate: [100, 50, 100],
            data: payload.data,
            actions: [
                {
                    action: 'open',
                    title: 'Open'
                }
            ],
            // Add these for iOS
            renotify: true,
            tag: 'message',
            requireInteraction: true
        };

        event.waitUntil(
            self.registration.showNotification(payload.notification.title, options)
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

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const payload = event.data.payload;
        self.registration.showNotification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/ios-icon-192.png',
            badge: '/ios-icon-192.png',
            vibrate: [100, 50, 100],
            data: payload.data,
            actions: [
                {
                    action: 'open',
                    title: 'Open'
                }
            ],
            // Add these for iOS
            renotify: true,
            tag: 'message',
            requireInteraction: true
        });
    }
});