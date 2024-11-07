import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, messaging } from '../firebase';
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
                
                // First, check if service worker is registered
                const existingRegistrations = await navigator.serviceWorker.getRegistrations();
                console.log('Existing service workers:', existingRegistrations.length);
                
                // Unregister existing service workers
                await Promise.all(existingRegistrations.map(reg => reg.unregister()));

                // Register new service worker
                console.log('Registering new service worker...');
                registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/'
                });
                console.log('Service Worker registered:', registration);

                const permission = await Notification.requestPermission();
                console.log('Notification permission:', permission);
                setNotificationPermission(permission);

                if (permission === 'granted') {
                    try {
                        // Initialize messaging
                        const messagingInstance = getMessaging();
                        console.log('Getting FCM token...');
                        
                        const currentToken = await getToken(messagingInstance, {
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
                        } else {
                            console.error('No FCM token received');
                        }
                    } catch (tokenError) {
                        console.error('Error getting FCM token:', tokenError);
                    }
                }
            } catch (error) {
                console.error('Error in notification initialization:', error);
            }
        };

        initializeNotifications();

        return () => {
            if (registration) {
                registration.unregister().catch(console.error);
            }
        };
    }, [auth.currentUser]);

    return { notificationPermission, fcmToken };
};