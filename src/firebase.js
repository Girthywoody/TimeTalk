import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

// Add this after your firebaseConfig
const ALLOWED_USERS = {
  user1: {
    email: "your-email@example.com",
    partnerId: "user2-uid"  // We'll fill this in after creating both accounts
  },
  user2: {
    email: "girlfriend-email@example.com",
    partnerId: "user1-uid"  // We'll fill this in after creating both accounts
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
        if (!messaging) return null;

        // First, check if service worker is registered
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // Get token only after permission is granted
            const token = await getToken(messaging, {
                vapidKey: 'BJ9j4bdUtNCIQtWDls0PqGtSoGW__yJSv4JZSOXzkuKTizgWLsmYC1t4OoxiYx4lrpbcNGm1IUobk_8dGLwvycc',
                serviceWorkerRegistration: registration
            });
            console.log('FCM Token:', token);
            return token;
        }
        return null;
    } catch (error) {
        console.error('Notification permission error:', error);
        return null;
    }
};

export { auth, db, storage, messaging, functions };