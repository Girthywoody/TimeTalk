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

        const message = {
            token: userData.fcmToken,
            notification: {
                title: notification.title,
                body: notification.body
            }
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

        const { userId } = req.body;
        
        const result = await sendNotificationToUser(userId, {
            title: 'Test Notification',
            body: 'This is a test notification!'
        });

        return res.json(result);
    } catch (error) {
        console.error('Error in sendNotification endpoint:', error);
        return res.status(500).json({ error: error.message });
    }
});

exports.checkScheduledPosts = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    try {
        const now = new Date();
        const postsRef = admin.firestore().collection('posts');
        
        // 1. Check for posts that need day-before notifications
        const preNotificationSnapshot = await postsRef
            .where('scheduledNotificationSent', '==', false)
            .where('notificationTime', '<=', now.toISOString())
            .where('needsPreNotification', '==', true)
            .get();

        // 2. Check for posts that are ready to be shown
        const postReadySnapshot = await postsRef
            .where('scheduledFor', '<=', now.toISOString())
            .where('postNotificationSent', '!=', true)
            .where('isScheduled', '==', true)
            .get();

        const notifications = [];

        // Handle day-before notifications for subtle hint posts
        preNotificationSnapshot.forEach(doc => {
            const post = doc.data();
            
            // Only send pre-notifications for subtle hint posts
            if (!post.completelySecret && post.isScheduled) {
                notifications.push({
                    userId: post.partnerId,
                    notification: {
                        title: '🤫 Subtle Hint Coming Soon!',
                        body: `${post.author} has something special coming tomorrow!`,
                        data: {
                            type: 'scheduled_post_reminder',
                            postId: doc.id,
                            senderId: post.authorId,
                            timestamp: Date.now().toString()
                        }
                    },
                    update: {
                        scheduledNotificationSent: true
                    }
                });
            }
        });

        // Handle notifications for posts that are now visible
        postReadySnapshot.forEach(doc => {
            const post = doc.data();
            
            // Don't notify for completely secret posts
            if (!post.completelySecret) {
                notifications.push({
                    userId: post.partnerId,
                    notification: {
                        title: '💝 Scheduled Post Released!',
                        body: `${post.author}'s scheduled moment is now on your timeline!`,
                        data: {
                            type: 'post_released',
                            postId: doc.id,
                            senderId: post.authorId,
                            timestamp: Date.now().toString()
                        }
                    },
                    update: {
                        postNotificationSent: true
                    }
                });
            }
        });

        // Send all notifications and update documents
        await Promise.all(notifications.map(async (notif) => {
            // Send notification
            const idToken = await admin.auth().createCustomToken(notif.userId);
            await fetch('https://us-central1-timetalk-13a75.cloudfunctions.net/api/sendNotification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    userId: notif.userId,
                    notification: notif.notification
                })
            });

            // Update document
            if (notif.update) {
                await postsRef.doc(notif.postId).update(notif.update);
            }
        }));

        return null;
    } catch (error) {
        console.error('Error in checkScheduledPosts:', error);
        return null;
    }
});

exports.api = functions.https.onRequest(app);