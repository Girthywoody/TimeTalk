import { auth } from '../firebase';
//
export const sendNotification = async (userId, notificationData) => {
    if (!userId) {
      console.error('Invalid user ID for notification');
      return { success: false, error: 'Invalid user ID' };
    }
    
    try {
      // Generate a unique message ID based on content and timestamp
      const messageId = notificationData.data?.messageId || 
                        `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Use a specific notification key for this exact message
      const notificationKey = `sent_notification_${messageId}`;
      
      // Check if we've already sent this specific notification within the last minute
      if (localStorage.getItem(notificationKey)) {
        console.log('Duplicate notification prevented for message:', messageId);
        return { success: true, duplicate: true };
      }
      
      // Mark this notification as sent BEFORE sending it to prevent race conditions
      localStorage.setItem(notificationKey, 'true');
      
      // Get auth token
      const { auth } = await import('../firebase');
      
      if (!auth.currentUser) {
        console.error('User not authenticated');
        localStorage.removeItem(notificationKey); // Clean up if we can't proceed
        return { success: false, error: 'User not authenticated' };
      }
      
      // Get ID token and send notification
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
          data: {
            ...notificationData.data,
            deduplicationId: messageId, // Include the deduplication ID in the payload
            timestamp: Date.now()
          }
        })
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
  
      const result = await response.json();
      
      // Keep this notification key for 30 seconds to prevent duplicates
      setTimeout(() => {
        localStorage.removeItem(notificationKey);
      }, 30000);
      
      return result;
    } catch (error) {
      console.error('Notification sending failed:', error);
      return { success: false, error: error.message };
    }
};