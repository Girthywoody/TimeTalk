importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

console.log('Service Worker loading...');

const firebaseConfig = {
    apiKey: "AIzaSyDdFtxNbwQSYGfO3pUKG8hkkxlwhlikvQQ",
    authDomain: "timetalk-13a75.firebaseapp.com",
    projectId: "timetalk-13a75",
    storageBucket: "timetalk-13a75.appspot.com",
    messagingSenderId: "676555846687",
    appId: "1:676555846687:web:918431d0810a41980b512a",
    measurementId: "G-4JRNMJ99HS"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('Firebase Messaging initialized in SW');

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationOptions = {
        body: payload.notification.body,
        icon: '/ios-icon-192.png',
        badge: '/ios-icon-192.png',
        tag: `message-${Date.now()}`,
        data: payload.data || {},
        requireInteraction: true,
        vibrate: [100, 50, 100],
        actions: [
            {
                action: 'open',
                title: 'Open Chat'
            }
        ]
    };

    return self.registration.showNotification(
        payload.notification.title,
        notificationOptions
    );
});

self.addEventListener('notificationclick', function(event) {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);
    event.notification.close();

    const clickAction = event.notification.data.clickAction || 'https://time-talk.vercel.app/chat';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then(function(clientList) {
            for (const client of clientList) {
                if (client.url === clickAction && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(clickAction);
        })
    );
});

self.addEventListener('install', event => {
    console.log('[firebase-messaging-sw.js] Service Worker installing...');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    console.log('[firebase-messaging-sw.js] Service Worker activating...');
    event.waitUntil(self.clients.claim());
});