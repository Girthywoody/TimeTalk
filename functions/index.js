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
            return { success: false, error: 'No FCM token available' };
        }

        // Simplest possible message structure
        const message = {
            token: userData.fcmToken,
            notification: {
                title: notification.title,
                body: notification.body
            },
            data: {
                messageId: Date.now().toString()
            }
        };

        const response = await admin.messaging().send(message);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, error: error.message };
    }
}

// Update the test endpoint
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
            body: 'This is a test notification'
        });

        return res.json(result);
    } catch (error) {
        console.error('Error in sendNotification endpoint:', error);
        return res.status(500).json({ error: error.message });
    }
});

exports.api = functions.https.onRequest(app);