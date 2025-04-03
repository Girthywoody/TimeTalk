// Clear any existing cache on activation
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cache => {
                        return caches.delete(cache);
                    })
                );
            })
        ])
    );
});

// Initialize Firebase
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

// Store the processed message IDs to prevent duplicates
const processedMessages = new Set();

// Handle push events directly (important for iOS)
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push received:', event);

    if (event.data) {
        try {
            let payload;
            try {
                payload = event.data.json();
            } catch (e) {
                // If not JSON, try text
                const text = event.data.text();
                try {
                    payload = JSON.parse(text);
                } catch (e2) {
                    // Use text as is
                    payload = {
                        notification: {
                            title: 'New Notification',
                            body: text
                        }
                    };
                }
            }
            
            console.log('[Service Worker] Push payload:', payload);
            
            // Check for deduplication ID
            const messageId = payload.data?.deduplicationId || 
                             payload.data?.messageId || 
                             payload.data?.nudgeId || 
                             payload.data?.timestamp;
                             
            // Skip if this is a duplicate message we've already processed
            if (messageId && processedMessages.has(messageId)) {
                console.log('[Service Worker] Ignoring duplicate notification:', messageId);
                return;
            }
            
            // Add to processed messages
            if (messageId) {
                processedMessages.add(messageId);
                
                // Clean up old messages (after 5 minutes)
                setTimeout(() => {
                    processedMessages.delete(messageId);
                }, 5 * 60 * 1000);
            }

            // Set vibration pattern based on notification type
            let vibrationPattern = [200, 100, 200];
            
            // Special vibration for nudges
            if (payload.data?.type === 'nudge') {
                vibrationPattern = [200, 100, 200, 100, 200];
            }

            const notificationTitle = payload.notification?.title || 'New Message';
            const notificationOptions = {
                body: payload.notification?.body || 'You have a new notification',
                icon: '/ios-icon-192.png',
                badge: '/ios-icon-192.png',
                tag: messageId || Date.now().toString(),
                data: payload.data || {},
                actions: [{
                    action: 'open',
                    title: 'Open'
                }],
                renotify: true,
                requireInteraction: true,
                silent: false,
                vibrate: vibrationPattern
            };

            event.waitUntil(
                self.registration.showNotification(notificationTitle, notificationOptions)
            );
        } catch (error) {
            console.error('[Service Worker] Error handling push event:', error);
        }
    }
});

// Add to firebase-messaging-sw.js
self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click received:', event);
  
    event.notification.close();
  
    const notificationData = event.notification.data || {};
    const notificationType = notificationData.type || 'message';
    
    // Determine target URL based on notification type
    let targetUrl = '/';
    if (notificationType === 'nudge') {
        targetUrl = '/?nudged=true';
    }
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // Try to find an existing window/tab
            for (const client of clientList) {
                if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
                    // Post a message to the client
                    client.postMessage({
                        type: 'notificationClick',
                        notification: {
                            data: notificationData
                        }
                    });
                    
                    return client.focus();
                }
            }
            
            // If no existing window, open a new one
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

self.addEventListener('error', function(event) {
    console.error('[firebase-messaging-sw.js] Error:', event.error);
});