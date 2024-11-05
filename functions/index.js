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

// Single notification sending function
async function sendNotificationToUser(userId, notification) {
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
                vibrate: [100, 50, 100],
                requireInteraction: true,
                renotify: false, // Change to false to prevent duplicate notifications
                tag: notification.messageId || 'default' // Use messageId as tag
            },
            fcmOptions: {
                link: 'https://time-talk.vercel.app/chat'
            }
        }
    };

    try {
        await admin.messaging().send(message);
        return { success: true };
    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, error: error.message };
    }
}

// Test notification endpoint
app.post('/sendNotification', async (req, res) => {
    try {
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
            body: 'This is a test notification',
            messageId: 'test-' + Date.now() // Unique ID for test notification
        });

        return res.json(result);
    } catch (error) {
        console.error('Error in sendNotification endpoint:', error);
        return res.status(500).json({ error: error.message });
    }
});

exports.api = functions.https.onRequest(app);

// Firestore trigger for new messages
exports.onNewMessage = functions.firestore
    .document('messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const messageId = context.params.messageId;

        // Don't send notification for deleted or system messages
        if (message.deleted || message.type === 'system') {
            return null;
        }

        try {
            // Get sender's profile
            const senderDoc = await admin.firestore().collection('users').doc(message.senderId).get();
            const senderData = senderDoc.data();
            
            // Prepare notification message
            let notificationBody = '';
            if (message.type === 'text' || message.type === 'mixed') {
                notificationBody = message.text || 'Sent you a message';
            } else if (message.type === 'image') {
                notificationBody = 'Sent you an image';
            } else if (message.type === 'file') {
                notificationBody = 'Sent you a file';
            }

            // Get all users except sender
            const usersSnapshot = await admin.firestore().collection('users').get();
            const notifications = [];
            
            // Send notification to each user and update message
            for (const userDoc of usersSnapshot.docs) {
                if (userDoc.id !== message.senderId) {
                    // Send notification
                    notifications.push(
                        sendNotificationToUser(userDoc.id, {
                            title: `${senderData?.username || 'New Message'}`,
                            body: notificationBody,
                            messageId // Use messageId as tag
                        })
                    );
                }
            }

            // Update message with notification status
            await admin.firestore().collection('messages').doc(messageId).update({
                notifications: {
                    sent: true,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    recipients: usersSnapshot.docs
                        .filter(doc => doc.id !== message.senderId)
                        .map(doc => ({
                            userId: doc.id,
                            status: 'sent'
                        }))
                }
            });

            await Promise.all(notifications);
            return null;
        } catch (error) {
            console.error('Error in onNewMessage:', error);
            return null;
        }
    });