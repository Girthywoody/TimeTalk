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

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationOptions = {
        body: payload.notification.body,
        icon: '/ios-icon-192.png',
        badge: '/ios-icon-192.png',
        vibrate: [100, 50, 100],
        data: payload.data,
        tag: payload.data?.timestamp || Date.now().toString(),
        renotify: false
    };

    return self.registration.showNotification(
        payload.notification.title,
        notificationOptions
    );
});