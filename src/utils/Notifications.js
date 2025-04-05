import { auth } from '../firebase';

// Modify src/utils/Notifications.js
export const sendNotification = async (userId, notificationData) => {
  if (!userId) {
    console.error('Invalid user ID for notification');
    return { success: false, error: 'Invalid user ID' };
  }
  
  // Create a unique ID for this specific notification
  const notificationId = `${userId}_${notificationData.data?.type || 'unknown'}_${Date.now()}`;
  
  // Check if we've sent this notification in the last 10 seconds
  const recentNotifications = JSON.parse(localStorage.getItem('recent_notifications') || '{}');
  const now = Date.now();
  
  // Clean up old entries
  Object.keys(recentNotifications).forEach(key => {
    if (now - recentNotifications[key] > 10000) { // 10 seconds
      delete recentNotifications[key];
    }
  });
  
  // Check if this is a duplicate
  if (notificationData.data?.messageId && 
      Object.keys(recentNotifications).some(key => 
        key.includes(notificationData.data.messageId))) {
    console.log('Duplicate message notification prevented');
    return { success: true, duplicate: true };
  }
  
  // Store this notification in recent notifications
  recentNotifications[notificationId] = now;
  localStorage.setItem('recent_notifications', JSON.stringify(recentNotifications));
  
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
        data: {
          ...notificationData.data,
          deduplicationId: notificationId // Add this ID for server-side deduplication
        }
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