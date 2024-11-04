const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');
const express = require('express');

admin.initializeApp();

const app = express();

// Enable CORS for your domain
app.use(cors({ 
    origin: true,
    methods: ['POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Wrap your function in express middleware
app.post('/sendNotification', async (req, res) => {
    try {
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        if (!decodedToken.uid) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { userId, notification } = req.body;

        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        if (userData?.fcmToken) {
            const message = {
                token: userData.fcmToken,
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                webpush: {
                    headers: {
                        Urgency: 'high'
                    },
                    notification: {
                        title: notification.title,
                        body: notification.body,
                        icon: '/ios-icon-192.png',
                        badge: '/ios-icon-192.png',
                        vibrate: [100, 50, 100],
                        requireInteraction: true,
                        renotify: true
                    },
                    fcmOptions: {
                        link: 'https://time-talk.vercel.app/chat'
                    }
                },
                data: {
                    url: 'https://time-talk.vercel.app/chat'
                }
            };

            await admin.messaging().send(message);
            return res.json({ success: true });
        }
        return res.json({ success: false, error: 'No FCM token found for user' });
    } catch (error) {
        console.error('Error sending notification:', error);
        return res.status(500).json({ error: error.message });
    }
});

exports.api = functions.https.onRequest(app);

// Also keep the callable function for backward compatibility
exports.sendNotification = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { userId, notification } = data;

    try {
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        if (userData?.fcmToken) {
            const message = {
                token: userData.fcmToken,
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                webpush: {
                    headers: {
                        Urgency: 'high'
                    },
                    notification: {
                        title: notification.title,
                        body: notification.body,
                        icon: '/ios-icon-192.png',
                        badge: '/ios-icon-192.png',
                        vibrate: [100, 50, 100],
                        requireInteraction: true,
                        renotify: true
                    },
                    fcmOptions: {
                        link: 'https://time-talk.vercel.app/chat'
                    }
                }
            };

            await admin.messaging().send(message);
            return { success: true };
        }
        return { success: false, error: 'No FCM token found for user' };
    } catch (error) {
        console.error('Error sending notification:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});