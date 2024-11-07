import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getMessaging, getToken } from 'firebase/messaging';

export const useNotifications = () => {
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [fcmToken, setFcmToken] = useState(null);

    useEffect(() => {
        let registration = null;
        
        const initializeNotifications = async () => {
            if (!auth.currentUser) {
                console.log('No authenticated user found');
                return;
            }

            try {
                console.log('Starting notification initialization...');
                
                // Check if messaging is supported
                if (!messaging) {
                    console.error('Firebase messaging is not supported');
                    return;
                }

                // Unregister existing service workers
                const existingRegistrations = await navigator.serviceWorker.getRegistrations();
                console.log('Existing service workers:', existingRegistrations.length);
                await Promise.all(existingRegistrations.map(reg => reg.unregister()));

                // Register new service worker
                console.log('Registering new service worker...');
                registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('Service worker registered:', registration);

                const permission = await Notification.requestPermission();
                console.log('Notification permission:', permission);
                setNotificationPermission(permission);

                if (permission === 'granted') {
                    const messaging = getMessaging();
                    console.log('Getting FCM token...');
                    const currentToken = await getToken(messaging, {
                        vapidKey: 'BJ9j4bdUtNCIQtWDls0PqGtSoGW__yJSv4JZSOXzkuKTizgWLsmYC1t4OoxiYx4lrpbcNGm1IUobk_8dGLwvycc',
                        serviceWorkerRegistration: registration
                    });

                    console.log('FCM Token received:', currentToken ? 'Yes' : 'No');
                    if (currentToken) {
                        setFcmToken(currentToken);
                        const userRef = doc(db, 'users', auth.currentUser.uid);
                        console.log('Updating user document with FCM token...');
                        await updateDoc(userRef, {
                            fcmToken: currentToken,
                            notificationsEnabled: true,
                            lastTokenUpdate: serverTimestamp()
                        });
                        console.log('User document updated successfully');
                    }
                }
            } catch (error) {
                console.error('Error in notification initialization:', error);
            }
        };

        initializeNotifications();

        return () => {
            if (registration) {
                console.log('Cleaning up service worker registration');
                registration.unregister();
            }
        };
    }, [auth.currentUser]);

    return { notificationPermission, fcmToken };
};