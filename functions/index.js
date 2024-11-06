const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');
const express = require('express');

admin.initializeApp();

const app = express();

app.use(cors({ 
    origin: true,
    methods: ['POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

async function sendNotificationToUser(userId, notification) {
    try {
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        if (!userData?.fcmToken) {
            console.log('No FCM token found for user:', userId);
            return { success: false, error: 'No FCM token found for user' };
        }

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
                    tag: 'message',
                    vibrate: [100, 50, 100],
                    requireInteraction: true,
                    renotify: true
                },
                fcmOptions: {
                    link: 'https://time-talk.vercel.app/chat'
                }
            }
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent notification:', response);
        return { success: true };
    } catch (error) {
        console.error('Error sending notification:', error);
        if (error.code === 'messaging/registration-token-not-registered') {
            // Remove invalid token
            await admin.firestore().collection('users').doc(userId).update({
                fcmToken: admin.firestore.FieldValue.delete()
            });
        }
        return { success: false, error: error.message };
    }
}

// Test notification endpoint
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

        const { userId } = req.body;
        
        const result = await sendNotificationToUser(userId, {
            title: 'Test Notification',
            body: 'This is a test notification'
        });

        return res.json(result);
    } catch (error) {
        console.error('Error in sendNotification endpoint:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Firestore trigger for new messages
exports.onNewMessage = functions.firestore
    .document('messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();

        // Don't send notification for deleted or system messages
        if (message.deleted || message.type === 'system') {
            return null;
        }

        try {
            // Get sender's profile
            const senderDoc = await admin.firestore().collection('users').doc(message.senderId).get();
            const senderData = senderDoc.data();
            
            // Get all users except sender
            const usersSnapshot = await admin.firestore().collection('users').get();
            
            // Send notifications
            for (const userDoc of usersSnapshot.docs) {
                if (userDoc.id !== message.senderId) {
                    await sendNotificationToUser(userDoc.id, {
                        title: `Message from ${senderData?.username || 'Someone'}`,
                        body: message.text || 'New message'
                    });
                }
            }

            return null;
        } catch (error) {
            console.error('Error sending chat notification:', error);
            return null;
        }
    });

exports.api = functions.https.onRequest(app);