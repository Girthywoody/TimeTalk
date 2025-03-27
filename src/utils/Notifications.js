import { auth } from '../firebase';

// Cache for recent notifications to prevent duplicates
const notificationCache = new Map();
const CACHE_DURATION = 5000; // 5 seconds

export const sendNotification = async (userId, notificationData) => {
    if (!userId) {
      console.error('Invalid user ID for notification');
      return { success: false, error: 'Invalid user ID' };
    }
    
    
    // Create a unique key for this notification
    const cacheKey = `${userId}_${notificationData.title}_${notificationData.body}_${Date.now()}`;
    
    // Check if this notification was recently sent
    const cachedNotification = notificationCache.get(cacheKey);
    if (cachedNotification && Date.now() - cachedNotification.timestamp < CACHE_DURATION) {
      console.log('Duplicate notification prevented');
      return { success: true, duplicate: true };
    }
    
    // Store this notification in cache
    notificationCache.set(cacheKey, {
      timestamp: Date.now(),
      data: notificationData
    });
    
    // Clean up old cache entries
    setTimeout(() => {
      notificationCache.delete(cacheKey);
    }, CACHE_DURATION);
    
    try {
      // Get the auth instance dynamically to prevent potential undefined errors
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