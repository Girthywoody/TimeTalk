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

// CRUCIAL: This Set prevents duplicate notifications - DO NOT REMOVE
const displayedNotifications = new Set();

// CRUCIAL: This event handler must remain as onBackgroundMessage - DO NOT CHANGE
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    // CRUCIAL: event.waitUntil() is required to prevent duplicate notifications - DO NOT REMOVE
    return event.waitUntil(
        (async () => {
            // CRUCIAL: Unique ID generation for deduplication - DO NOT MODIFY
            const notificationId = payload.data?.timestamp || Date.now().toString();

            // CRUCIAL: Duplicate check logic - DO NOT MODIFY
            if (displayedNotifications.has(notificationId)) {
                console.log('Duplicate notification prevented:', notificationId);
                return;
            }

            // CRUCIAL: Notification tracking - DO NOT REMOVE
            displayedNotifications.add(notificationId);

            // CRUCIAL: Cleanup logic - DO NOT REMOVE
            setTimeout(() => {
                displayedNotifications.delete(notificationId);
            }, 5000);

            const notificationOptions = {
                body: payload.notification.body,
                icon: '/ios-icon-192.png',
                badge: '/ios-icon-192.png',
                vibrate: [100, 50, 100],
                data: payload.data,
                // CRUCIAL: tag property helps prevent duplicates - DO NOT REMOVE
                tag: notificationId,
                renotify: false
            };

            // CRUCIAL: This is the actual notification display call - DO NOT MODIFY
            return self.registration.showNotification(
                payload.notification.title,
                notificationOptions
            );
        })()
    );
});