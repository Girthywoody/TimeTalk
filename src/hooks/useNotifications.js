import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getMessaging, getToken } from 'firebase/messaging';

export const useNotifications = () => {
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [fcmToken, setFcmToken] = useState(null);

    useEffect(() => {
        let registrationPromise = null;

        const initializeNotifications = async () => {
            if (!auth.currentUser) return;

            try {
                // Get all existing service worker registrations
                const registrations = await navigator.serviceWorker.getRegistrations();
                
                // Unregister any existing service workers
                await Promise.all(registrations.map(reg => reg.unregister()));

                // Register new service worker with specific scope
                registrationPromise = navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/'
                });

                const registration = await registrationPromise;
                console.log('Service Worker registered:', registration);

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

        // Cleanup function
        return () => {
            if (registrationPromise) {
                registrationPromise.then(registration => {
                    registration.unregister();
                }).catch(console.error);
            }
        };
    }, [auth.currentUser]);

    return {
        notificationPermission,
        fcmToken
    };
};