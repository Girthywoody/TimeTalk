import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getMessaging, getToken } from 'firebase/messaging';

export const useNotifications = () => {
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [fcmToken, setFcmToken] = useState(null);

    useEffect(() => {
        const initializeNotifications = async () => {
            if (!auth.currentUser) return;

            try {
                // Check for existing service worker registration
                const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
                
                let registration;
                if (!existingRegistration) {
                    // Only register if no existing registration
                    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    console.log('New Service Worker registered:', registration);
                } else {
                    registration = existingRegistration;
                    console.log('Using existing Service Worker:', registration);
                }

                const permission = await Notification.requestPermission();
                setNotificationPermission(permission);

                if (permission === 'granted') {
                    const messaging = getMessaging();
                    const token = await getToken(messaging, {
                        vapidKey: 'BJ9j4bdUtNCIQtWDls0PqGtSoGW__yJSv4JZSOXzkuKTizgWLsmYC1t4OoxiYx4lrpbcNGm1IUobk_8dGLwvycc',
                        serviceWorkerRegistration: registration
                    });

                    if (token) {
                        setFcmToken(token);
                        
                        // Store token in Firestore
                        const userRef = doc(db, 'users', auth.currentUser.uid);
                        const userDoc = await getDoc(userRef);
                        
                        const tokenData = {
                            fcmToken: token,
                            notificationsEnabled: true,
                            lastTokenUpdate: new Date().toISOString()
                        };

                        if (userDoc.exists()) {
                            await updateDoc(userRef, tokenData);
                        } else {
                            await setDoc(userRef, tokenData, { merge: true });
                        }
                    }
                }
            } catch (error) {
                console.error('Error initializing notifications:', error);
            }
        };

        initializeNotifications();
    }, [auth.currentUser]);

    return {
        notificationPermission,
        fcmToken
    };
};