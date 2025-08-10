import { auth } from '../firebase';

// Utility functions for sending notifications via Firebase Cloud Functions

export const sendNotification = async (userId, notificationData) => {
  if (!userId) {
    console.error('Invalid user ID for notification');
    return { success: false, error: 'Invalid user ID' };
  }
  
  // Log the notification attempt for debugging
  console.log(`Attempting to send notification to userId: ${userId}`);
  
  try {
    // Check if we have a current user and authentication
    if (!auth.currentUser) {
      console.error('No authenticated user available to send notification');
      return { success: false, error: 'Not authenticated' };
    }
    
    const idToken = await auth.currentUser.getIdToken(true);
    
    // Make a preliminary check to see if the user exists
    try {
      const userCheckResponse = await fetch(
        `https://us-central1-timetalk-13a75.cloudfunctions.net/api/checkUser`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ userId })
        }
      );

      if (userCheckResponse.ok) {
        const userCheckResult = await userCheckResponse.json();
        if (!userCheckResult.exists) {
          console.error(`User ${userId} does not exist in the database`);
          return { success: false, error: 'User not found' };
        }
      } else {
        // Avoid JSON parsing of HTML error pages
        console.warn(
          `User check endpoint responded with ${userCheckResponse.status}`
        );
      }
    } catch (checkError) {
      // If the checkUser endpoint doesn't exist or returns invalid JSON,
      // continue with the notification attempt
      console.warn('User check failed, attempting notification anyway:', checkError);
    }
    
    // Continue with notification sending
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
    
    // If the server indicates no FCM token, return a more specific error
    if (result.error && result.error.includes('No FCM token')) {
      return { success: false, error: 'Partner has not enabled notifications' };
    }
    
    return result;
  } catch (error) {
    console.error('Notification sending failed:', error);
    return { success: false, error: error.message };
  }
};
