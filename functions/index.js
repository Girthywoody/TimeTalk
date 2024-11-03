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
            await admin.messaging().send({
                token: userData.fcmToken,
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                webpush: {
                    fcmOptions: {
                        link: '/'
                    }
                }
            });
            return { success: true };
        }
        return { success: false, error: 'No FCM token found for user' };
    } catch (error) {
        console.error('Error sending notification:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});