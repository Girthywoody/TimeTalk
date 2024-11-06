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

async function sendNotificationToUser(userId, { senderName, messageContent, messageId, messageType }) {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData?.fcmToken) {
        console.log('No FCM token found for user:', userId);
        return { success: false, error: 'No FCM token found for user' };
    }

    // Format notification content based on message type
    let title = `Message from ${senderName}`;
    let body = messageContent;

    if (messageType === 'image') {
        body = '📷 Sent you an image';
    } else if (messageType === 'file') {
        body = '📎 Sent you a file';
    } else if (!messageContent) {
        body = 'Sent you a message';
    }

    const message = {
        token: userData.fcmToken,
        notification: {
            title,
            body,
        },
        webpush: {
            headers: {
                Urgency: 'high'
            },
            notification: {
                title,
                body,
                icon: '/ios-icon-192.png',
                badge: '/ios-icon-192.png',
                vibrate: [100, 50, 100],
                requireInteraction: true,
                renotify: false,
                tag: messageId || 'default',
                actions: [
                    {
                        action: 'reply',
                        title: 'Reply'
                    },
                    {
                        action: 'mark-read',
                        title: 'Mark as Read'
                    }
                ],
                silent: false
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
            senderName: 'Test',
            messageContent: 'This is a test notification',
            messageId: 'test-' + Date.now(),
            messageType: 'text'
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
            const senderName = senderData?.username || senderData?.displayName || 'Someone';
            
            // Get all users except sender
            const usersSnapshot = await admin.firestore().collection('users').get();
            const notifications = [];
            
            // Send notification to each user and update message
            for (const userDoc of usersSnapshot.docs) {
                if (userDoc.id !== message.senderId) {
                    // Send notification
                    notifications.push(
                        sendNotificationToUser(userDoc.id, {
                            senderName,
                            messageContent: message.text,
                            messageId,
                            messageType: message.type
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
                            status: 'sent',
                            sentAt: admin.firestore.FieldValue.serverTimestamp()
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