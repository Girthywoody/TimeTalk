import { auth } from '../firebase';

export const sendNotification = async (userId, { title, body, data = {} }) => {
  try {
    const idToken = await auth.currentUser.getIdToken(true);
    const response = await fetch('https://us-central1-timetalk-13a75.cloudfunctions.net/api/simpleNotification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        userId,
        title,
        body,
        data: {
          ...data,
          timestamp: Date.now().toString(),
          senderId: auth.currentUser.uid,
          clickAction: '/'
        }
      })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to send notification');
    }
    
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};