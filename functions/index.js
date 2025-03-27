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
            console.log('No FCM token for user:', userId);
            return { success: false, error: 'No FCM token available' };
        }

        // Create a properly formatted FCM message
        const message = {
            token: userData.fcmToken,
            notification: {
                title: notification.title,
                body: notification.body
            },
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                notification: {
                    icon: '/ios-icon-192.png',
                    badge: '/ios-icon-192.png',
                    vibrate: notification.vibrate || [200, 100, 200],
                    requireInteraction: true,
                    renotify: true
                },
                fcmOptions: {
                    link: notification.data?.clickAction || '/'
                }
            },
            android: {
                notification: {
                    icon: '/ios-icon-192.png',
                    priority: notification.priority || 'high'
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: notification.sound || 'default'
                    }
                }
            },
            data: notification.data || {}
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent notification:', response);
        return { success: true };
    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, error: error.message };
    }
}

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

        const { userId, notification } = req.body;
        
        // Use the provided notification or fallback to test notification
        const notificationToSend = notification || {
            title: 'Test Notification',
            body: 'This is a test notification!',
            data: {
                type: 'test',
                senderId: decodedToken.uid,
                timestamp: Date.now().toString()
            }
        };

        const result = await sendNotificationToUser(userId, notificationToSend);
        return res.json(result);
    } catch (error) {
        console.error('Error in sendNotification endpoint:', error);
        return res.status(500).json({ error: error.message });
    }
});

exports.publishScheduledPosts = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  const now = new Date();
  
  const scheduledPosts = await db.collection('posts')
    .where('isScheduled', '==', true)
    .where('scheduledFor', '<=', now.toISOString())
    .get();

  const batch = db.batch();
  
  scheduledPosts.docs.forEach((doc) => {
    batch.update(doc.ref, {
      isScheduled: false,
      publishedAt: now.toISOString()
    });
  });

  await batch.commit();
});

exports.api = functions.https.onRequest(app);