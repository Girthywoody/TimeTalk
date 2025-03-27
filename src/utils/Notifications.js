import { auth } from '../firebase';

// 1. First, let's fix your Notifications.js utility function
// This is a more robust version that prevents duplicate calls

export const sendNotification = async (userId, notificationData) => {
    if (!userId) {
      console.error('Invalid user ID for notification');
      return { success: false, error: 'Invalid user ID' };
    }
    
    // Prevent multiple identical notifications within a short time window
    const cacheKey = `notification_${userId}_${notificationData.title}_${Date.now()}`;
    if (window.recentNotifications && window.recentNotifications[cacheKey]) {
      console.log('Duplicate notification prevented');
      return { success: true, duplicate: true };
    }
    
    // Store this notification attempt in cache
    if (!window.recentNotifications) window.recentNotifications = {};
    window.recentNotifications[cacheKey] = true;
    
    // Clear this cache entry after 5 seconds
    setTimeout(() => {
      if (window.recentNotifications && window.recentNotifications[cacheKey]) {
        delete window.recentNotifications[cacheKey];
      }
    }, 5000);
    
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