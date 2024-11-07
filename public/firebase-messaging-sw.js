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

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    // Wrap the notification logic in event.waitUntil()
    return event.waitUntil(
        (async () => {
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
                tag: notificationId,
                renotify: false
            };

            return self.registration.showNotification(
                payload.notification.title,
                notificationOptions
            );
        })()
    );
});