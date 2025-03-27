import { auth } from '../firebase';

// In your Notifications.js file, ensure the sendNotification function has good error handling
export const sendNotification = async (userId, notificationData) => {
    if (!userId) {
      console.error('Invalid user ID for notification');
      return { success: false, error: 'Invalid user ID' };
    }
    
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch('https://us-central1-timetalk-13a75.cloudfunctions.net/api/simpleNotification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          userId: userId,
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {}
        })
      });
  
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Notification sending failed:', error);
      return { success: false, error: error.message };
    }
  };