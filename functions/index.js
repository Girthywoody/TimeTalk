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
                    tag: notification.tag || 'default',
                    vibrate: [100, 50, 100],
                    requireInteraction: true,
                    renotify: true
                },
                fcmOptions: {
                    link: notification.link || 'https://time-talk.vercel.app/'
                }
            }
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent notification:', response);
        return { success: true };
    } catch (error) {
        console.error('Error sending notification:', error);
        if (error.code === 'messaging/registration-token-not-registered') {
            await admin.firestore().collection('users').doc(userId).update({
                fcmToken: admin.firestore.FieldValue.delete()
            });
        }
        return { success: false, error: error.message };
    }
}

// Function to send notifications for calendar events
exports.checkCalendarNotifications = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async (context) => {
        const now = admin.firestore.Timestamp.now();
        const fiveMinutesLater = new Date(now.toMillis() + 5 * 60 * 1000);

        try {
            const eventsSnapshot = await admin.firestore()
                .collection('events')
                .get();

            for (const eventDoc of eventsSnapshot.docs) {
                const event = eventDoc.data();
                
                // Check each notification time
                if (event.notificationTimes) {
                    for (const notificationTime of event.notificationTimes) {
                        const notificationDate = new Date(notificationTime);
                        
                        // If notification time falls within next 5 minutes and hasn't been sent
                        if (notificationDate > now.toDate() && notificationDate <= fiveMinutesLater &&
                            (!event.sentNotifications || !event.sentNotifications.includes(notificationTime))) {
                            
                            // Send notification
                            await sendNotificationToUser(event.userId, {
                                title: 'Event Reminder',
                                body: `Upcoming: ${event.title}`,
                                tag: `event-${eventDoc.id}`,
                                link: 'https://time-talk.vercel.app/calendar'
                            });

                            // Mark notification as sent
                            await eventDoc.ref.update({
                                sentNotifications: admin.firestore.FieldValue.arrayUnion(notificationTime)
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error checking calendar notifications:', error);
        }
});

// Function to handle new immediate posts
exports.onNewPost = functions.firestore
    .document('posts/{postId}')
    .onCreate(async (snap, context) => {
        const post = snap.data();
        
        // Don't notify for scheduled posts that aren't due yet
        if (post.isScheduled) {
            const scheduledDate = new Date(post.scheduledFor);
            const now = new Date();
            if (scheduledDate > now) return null;
        }

        try {
            // Get all users
            const usersSnapshot = await admin.firestore().collection('users').get();
            
            for (const userDoc of usersSnapshot.docs) {
                if (userDoc.id !== post.authorId) {
                    await sendNotificationToUser(userDoc.id, {
                        title: 'New Timeline Post',
                        body: post.content ? 
                            (post.content.length > 100 ? post.content.substring(0, 97) + '...' : post.content) :
                            'New post shared on timeline',
                        tag: `post-${snap.id}`,
                        link: 'https://time-talk.vercel.app/'
                    });
                }
            }
        } catch (error) {
            console.error('Error sending post notification:', error);
        }
});

// Function to check scheduled posts
exports.checkScheduledPosts = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async (context) => {
        const now = admin.firestore.Timestamp.now();
        
        try {
            // Get scheduled posts
            const scheduledPostsSnapshot = await admin.firestore()
                .collection('posts')
                .where('isScheduled', '==', true)
                .get();

            for (const postDoc of scheduledPostsSnapshot.docs) {
                const post = postDoc.data();
                const scheduledDate = new Date(post.scheduledFor);
                const oneDayBefore = new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000);
                
                // Check if it's one day before and notification hasn't been sent
                if (!post.scheduledNotificationSent && 
                    oneDayBefore <= now.toDate() && 
                    scheduledDate > now.toDate()) {
                    
                    // Send notification to post author
                    await sendNotificationToUser(post.authorId, {
                        title: 'Scheduled Post Reminder',
                        body: `Your post "${post.content ? (post.content.substring(0, 50) + '...') : 'Untitled'}" will be published tomorrow`,
                        tag: `scheduled-post-${postDoc.id}`,
                        link: 'https://time-talk.vercel.app/'
                    });

                    // Mark notification as sent
                    await postDoc.ref.update({
                        scheduledNotificationSent: true
                    });
                }
            }
        } catch (error) {
            console.error('Error checking scheduled posts:', error);
        }
});

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
            body: 'This is a test notification'
        });

        return res.json(result);
    } catch (error) {
        console.error('Error in sendNotification endpoint:', error);
        return res.status(500).json({ error: error.message });
    }
});

exports.api = functions.https.onRequest(app);