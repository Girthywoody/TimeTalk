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


app.post('/simpleNotification', async (req, res) => {
    console.log('Received simple notification request:', req.body);
    try {
        // Authenticate the request
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        if (!decodedToken.uid) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Get the request data
        const { userId, title, body } = req.body;
        
        if (!userId || !title || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get the user's FCM token
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        if (!userData?.fcmToken) {
            return res.json({ success: false, error: 'No FCM token available' });
        }

        // Create the most basic message possible
        const message = {
            token: userData.fcmToken,
            notification: {
                title: title,
                body: body
            }
        };

        try {
            // Send the notification
            const response = await admin.messaging().send(message);
            console.log('Successfully sent simple notification:', response);
            return res.json({ success: true });
        } catch (error) {
            console.error('FCM error:', error);
            return res.json({ success: false, error: error.message });
        }
    } catch (error) {
        console.error('Error in simpleNotification endpoint:', error);
        return res.status(500).json({ error: error.message });
    }
});

async function sendNotificationToUser(userId, info) {
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
                title: info.title,
                body: info.body
            },
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                notification: {
                    icon: '/ios-icon-192.png',
                    badge: '/ios-icon-192.png',
                    vibrate: [200, 100, 200],
                    requireInteraction: true,
                    renotify: true
                },
                fcmOptions: {
                    link: info.data?.clickAction || '/'
                }
            },
            android: {
                notification: {
                    icon: '/ios-icon-192.png',
                    priority: 'high'
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default'
                    }
                }
            },
            data: info.data || {}
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent notification:', response);
        return { success: true };
    } catch (error) {
        console.error('Error sending notification:', error);
        // Check for detailed error information
        if (error.errorInfo) {
            console.error('Error details:', error.errorInfo);
        }
        return { success: false, error: error.message };
    }
}

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