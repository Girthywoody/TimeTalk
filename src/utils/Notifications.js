import { auth } from '../firebase';


export const sendNotification = async (userId, notificationData) => {
  if (!userId) {
    console.error('Invalid user ID for notification');
    return { success: false, error: 'Invalid user ID' };
  }
  
  // Create a unique ID for this specific notification
  const notificationId = `${userId}_${notificationData.data?.type || 'unknown'}_${Date.now()}`;
  
  // Check for message deduplication but with a shorter window (2 seconds)
  if (notificationData.data?.messageId) {
    const recentMessages = JSON.parse(localStorage.getItem('recent_message_ids') || '[]');
    if (recentMessages.includes(notificationData.data.messageId)) {
      console.log('Duplicate message notification prevented');
      return { success: true, duplicate: true };
    }
    
    // Store message ID with expiration (store last 10 messages)
    recentMessages.push(notificationData.data.messageId);
    if (recentMessages.length > 10) recentMessages.shift();
    localStorage.setItem('recent_message_ids', JSON.stringify(recentMessages));
  }
  
  try {
    // Check if we have a current user and authentication
    if (!auth.currentUser) {
      console.error('No authenticated user available to send notification');
      return { success: false, error: 'Not authenticated' };
    }
    
    const idToken = await auth.currentUser.getIdToken(true);
    
    console.log('Sending notification to user:', userId, 'with data:', notificationData);
    
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
    console.log('Notification API response:', result);
    return result;
  } catch (error) {
    console.error('Notification sending failed:', error);
    return { success: false, error: error.message };
  }
};