import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
        // Try to initialize with IndexedDB
        return initializeAuth(app, {
            persistence: indexedDBLocalPersistence,
            popupRedirectResolver: undefined
        });
    } catch (error) {
        console.error("Auth initialization error:", error);
        // Fallback to default auth if initialization fails
        return getAuth(app);
    }
})();

const db = getFirestore(app);
const storage = getStorage(app);

// Clear cached credentials on auth state change
auth.onAuthStateChanged(() => {
    // Force token refresh
    auth.currentUser?.getIdToken(true).catch(console.error);
});

export { auth, db, storage };