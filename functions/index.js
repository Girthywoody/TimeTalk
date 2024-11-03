const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendNotification = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
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
                        renotify: true,
                        actions: [
                            {
                                action: 'open',
                                title: 'Open Chat'
                            }
                        ]
                    },
                    fcmOptions: {
                        link: 'https://time-talk.vercel.app/chat'
                    }
                },
                android: {
                    priority: 'high',
                    notification: {
                        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                        priority: 'max',
                        sound: 'default',
                        sticky: true
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            'content-available': 1,
                            'mutable-content': 1,
                            sound: 'default',
                            badge: 1,
                            'alert': {
                                title: notification.title,
                                body: notification.body
                            }
                        }
                    },
                    fcmOptions: {
                        imageUrl: '/ios-icon-192.png'
                    }
                },
                data: {
                    url: 'https://time-talk.vercel.app/chat',
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                    messageId: Date.now().toString()
                }
            };

            await admin.messaging().send(message);
            
            // Log successful notification send
            await admin.firestore().collection('notificationLogs').add({
                userId: userId,
                token: userData.fcmToken,
                notification: notification,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                success: true
            });

            return { success: true };
        }

        // Log failed notification (no token)
        await admin.firestore().collection('notificationLogs').add({
            userId: userId,
            error: 'No FCM token found for user',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            success: false
        });

        return { success: false, error: 'No FCM token found for user' };
    } catch (error) {
        // Log error
        await admin.firestore().collection('notificationLogs').add({
            userId: userId,
            error: error.message,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            success: false
        });

        console.error('Error sending notification:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Add a function to handle message creation that automatically sends notifications
exports.onNewMessage = functions.firestore
    .document('messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();
        
        try {
            // Get recipient's user document
            const recipientDoc = await admin.firestore()
                .collection('users')
                .doc(message.recipientId)
                .get();

            const recipientData = recipientDoc.data();
            const senderDoc = await admin.firestore()
                .collection('users')
                .doc(message.senderId)
                .get();
            const senderData = senderDoc.data();

            if (recipientData?.fcmToken) {
                const notificationMessage = {
                    token: recipientData.fcmToken,
                    notification: {
                        title: `New message from ${senderData.username || 'Someone'}`,
                        body: message.text || 'Sent you a message',
                    },
                    webpush: {
                        headers: {
                            Urgency: 'high'
                        },
                        notification: {
                            icon: '/ios-icon-192.png',
                            badge: '/ios-icon-192.png',
                            vibrate: [100, 50, 100],
                            requireInteraction: true,
                            renotify: true,
                            actions: [
                                {
                                    action: 'open',
                                    title: 'Open Chat'
                                }
                            ]
                        },
                        fcmOptions: {
                            link: 'https://time-talk.vercel.app/chat'
                        }
                    },
                    data: {
                        messageId: context.params.messageId,
                        url: 'https://time-talk.vercel.app/chat'
                    }
                };

                await admin.messaging().send(notificationMessage);
            }
        } catch (error) {
            console.error('Error sending message notification:', error);
        }
    });