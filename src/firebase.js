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

// Add this function to check if email is allowed
export const isAllowedEmail = (email) => {
  return Object.values(ALLOWED_USERS).some(user => user.email === email);
};

// Export the allowed users config
export { ALLOWED_USERS };

export const requestNotificationPermission = async () => {
    try {
        if (!messaging) return null;

        // First, check if service worker is already registered
        let registration;
        const registrations = await navigator.serviceWorker.getRegistrations();
        const existingRegistration = registrations.find(reg => reg.scope.includes(window.location.origin));
        
        if (existingRegistration) {
            registration = existingRegistration;
            console.log('Using existing Service Worker registration:', registration);
        } else {
            // Register a new service worker
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/',
                updateViaCache: 'none'
            });
            console.log('New Service Worker registered:', registration);
        }

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        // Get token with the correct registration
        const token = await getToken(messaging, {
            vapidKey: 'BJ9j4bdUtNCIQtWDls0PqGtSoGW__yJSv4JZSOXzkuKTizgWLsmYC1t4OoxiYx4lrpbcNGm1IUobk_8dGLwvycc',
            serviceWorkerRegistration: registration
        });
        
        console.log('FCM Token obtained:', token);
        
        // Save token to user's document - fix doc reference
        if (auth.currentUser) {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                fcmToken: token,
                lastTokenUpdate: new Date().toISOString()
            });
        }
        
        return token;
    } catch (error) {
        console.error('Notification permission error:', error);
        return null;
    }
};

export { auth, db, storage, messaging, functions };