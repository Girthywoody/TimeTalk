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

// Restore the original function but with a scope check
export const requestNotificationPermission = async () => {
    try {
        if (!messaging) return null;

        // Get existing registration if any
        const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        
        let registration;
        if (existingRegistration) {
            registration = existingRegistration;
            console.log('Using existing Service Worker:', registration);
        } else {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/'
            });
            console.log('Service Worker registered:', registration);
        }

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