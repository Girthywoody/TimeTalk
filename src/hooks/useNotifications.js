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
            if (!auth.currentUser) return;

            try {
                // Unregister existing service workers
                const existingRegistrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(existingRegistrations.map(reg => reg.unregister()));

                // Register new service worker
                registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                await registration.update();

                const permission = await Notification.requestPermission();
                setNotificationPermission(permission);

                if (permission === 'granted') {
                    const messaging = getMessaging();
                    const currentToken = await getToken(messaging, {
                        vapidKey: 'BJ9j4bdUtNCIQtWDls0PqGtSoGW__yJSv4JZSOXzkuKTizgWLsmYC1t4OoxiYx4lrpbcNGm1IUobk_8dGLwvycc',
                        serviceWorkerRegistration: registration
                    });

                    if (currentToken) {
                        setFcmToken(currentToken);
                        const userRef = doc(db, 'users', auth.currentUser.uid);
                        await updateDoc(userRef, {
                            fcmToken: currentToken,
                            notificationsEnabled: true,
                            lastTokenUpdate: serverTimestamp()
                        });
                    }
                }
            } catch (error) {
                console.error('Error initializing notifications:', error);
            }
        };

        initializeNotifications();

        return () => {
            if (registration) {
                registration.unregister();
            }
        };
    }, [auth.currentUser]);

    return { notificationPermission, fcmToken };
};