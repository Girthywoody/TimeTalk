// src/services/notificationService.js
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';

export const initializeNotifications = async () => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    // Check if it's a PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    if (!isPWA) {
      throw new Error('Please install the app to enable notifications');
    }

    // Request permission if needed
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Register service worker if needed
    let registration;
    if ('serviceWorker' in navigator) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: 'BJ9j4bdUtNCIQtWDls0PqGtSoGW__yJSv4JZSOXzkuKTizgWLsmYC1t4OxiYx4lrpbcNGm1IUobk_8dGLwvycc',
      serviceWorkerRegistration: registration
    });

    if (!token) {
      throw new Error('Failed to get notification token');
    }

    // Update token in Firestore
    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fcmToken: token,
        notificationsEnabled: true,
        lastTokenUpdate: new Date().toISOString()
      });
    }

    return token;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    throw error;
  }
};

export const sendNotification = async (userId, notification) => {
  try {
    const idToken = await auth.currentUser.getIdToken(true);
    
    const response = await fetch('https://us-central1-timetalk-13a75.cloudfunctions.net/api/sendNotification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        userId,
        notification: {
          ...notification,
          sound: 'default',
          badge: '1',
          icon: '/ios-icon-192.png'
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