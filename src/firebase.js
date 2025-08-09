import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore'; // Add doc here
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyDdFtxNbwQSYGfO3pUKG8hkkxlwhlikvQQ",
    authDomain: "timetalk-13a75.firebaseapp.com",
    projectId: "timetalk-13a75",
    storageBucket: "timetalk-13a75.appspot.com",
    messagingSenderId: "676555846687",
    appId: "1:676555846687:web:918431d0810a41980b512a",
    measurementId: "G-4JRNMJ99HS"
};

// Clear existing apps
const apps = getApps();
if (apps.length) {
    apps.forEach(app => deleteApp(app));
}

const app = initializeApp(firebaseConfig);

// Initialize auth with custom settings for iOS
const auth = (() => {
    try {
        return initializeAuth(app, {
            persistence: indexedDBLocalPersistence,
            popupRedirectResolver: undefined
        });
    } catch (error) {
        console.error("Auth initialization error:", error);
        return getAuth(app);
    }
})();

const db = getFirestore(app);
const storage = getStorage(app);
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
const functions = getFunctions(app);

// Load VAPID key from environment to avoid using an invalid hardcoded key
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Add this after your firebaseConfig
const ALLOWED_USERS = {
  user1: {
    email: "joshua-law@hotmail.com",
    partnerId: "your-uid"
  },
  user2: {
    email: "hannahh.bolan@icloud.com",
    partnerId: "her-uid"
  }
};

export const refreshFCMToken = async () => {
    try {
      // Check if notifications are supported
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.error('This browser does not support notifications');
        return null;
      }
      
      // Check if permission is granted
      if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted');
        return null;
      }
      
      // Check for current user
      if (!auth.currentUser) {
        console.log('No authenticated user');
        return null;
      }
      
      // Get a fresh token
      try {
        // Use the existing service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Wait for the newly registered service worker to become active
        if (registration.installing) {
          await new Promise((resolve) => {
            registration.installing.addEventListener('statechange', (e) => {
              if (e.target.state === 'activated') {
                resolve();
              }
            });
          });
        } else if (!registration.active) {
          await navigator.serviceWorker.ready;
        }

        // Ensure we have a valid VAPID key before requesting a token
        if (!VAPID_KEY) {
          throw new Error('VAPID key is not defined');
        }

        // Get a new FCM token
        const messaging = getMessaging();
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });
        
        if (!token) {
          throw new Error('Failed to obtain FCM token');
        }
        
        // Update the token in Firestore
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          fcmToken: token,
          lastTokenUpdate: new Date().toISOString()
        });
        
        console.log('FCM token refreshed successfully');
        return token;
      } catch (error) {
        console.error('Error refreshing FCM token:', error);
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  };

// Add this function to check if email is allowed
export const isAllowedEmail = (email) => {
  return Object.values(ALLOWED_USERS).some(user => user.email === email);
};

// Export the allowed users config
export { ALLOWED_USERS };

export const requestNotificationPermission = async () => {
    try {
      // Step 1: Check browser support
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.error('This browser does not support notifications');
        return null;
      }
      
      // Step 2: Request permission if not already granted
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Notification permission denied');
          return null;
        }
      }
      
      // Step 3: Use existing service worker registration
      let registration;
      try {
        registration = await navigator.serviceWorker.ready;
      } catch (err) {
        console.error('Service worker registration failed:', err);
        return null;
      }
      
      // Step 4: Get FCM token with the fresh registration
      if (!VAPID_KEY) {
        throw new Error('VAPID key is not defined');
      }

      const messaging = getMessaging();
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      console.log('FCM Token obtained:', token);
      
      // Step 5: Save token to user's document
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          fcmToken: token,
          lastTokenUpdate: new Date().toISOString()
        });
      }
      
      return token;
    } catch (error) {
      console.error('Notification setup error:', error);
      return null;
    }
  };

export { auth, db, storage, messaging, functions };