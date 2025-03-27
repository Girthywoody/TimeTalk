import { auth } from '../firebase';

// 1. First, let's fix your Notifications.js utility function
// This is a more robust version that prevents duplicate calls

export const sendNotification = async (userId, notificationData) => {
    if (!userId) {
      console.error('Invalid user ID for notification');
      return { success: false, error: 'Invalid user ID' };
    }
    
    // Use a more unique cache key with message content hash
    const contentHash = `${notificationData.title}_${notificationData.body}`.substring(0, 20);
    const cacheKey = `notification_${userId}_${contentHash}`;
    
    // Use localStorage for more persistent duplicate prevention
    if (localStorage.getItem(cacheKey)) {
      console.log('Duplicate notification prevented');
      return { success: true, duplicate: true };
    }
    
    // Store this notification attempt in localStorage with 5-second expiry
    localStorage.setItem(cacheKey, Date.now().toString());
    setTimeout(() => localStorage.removeItem(cacheKey), 5000);
    
    try {
      // Rest of your existing code...
      const { auth } = await import('../firebase');
      
      if (!auth.currentUser) {
        console.error('User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }
      
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
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
  
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Notification sending failed:', error);
      return { success: false, error: error.message };
    }
};