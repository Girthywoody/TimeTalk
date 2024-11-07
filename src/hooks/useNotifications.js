import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export const useNotifications = () => {
    const [notificationPermission, setNotificationPermission] = useState('default');
    const [fcmToken, setFcmToken] = useState(null);
    const processedMessageIds = new Set();

    const initializeNotifications = async () => {
        if (!auth.currentUser) return;

        try {
            // Check existing permission first
            const existingPermission = Notification.permission;
            console.log('Existing notification permission:', existingPermission);

            // Only request if not already granted
            if (existingPermission !== 'granted') {
                const permission = await Notification.requestPermission();
                console.log('New notification permission:', permission);
                if (permission !== 'granted') {
                    throw new Error('Notification permission denied');
                }
            }

            const messaging = getMessaging();
            
            // Register service worker if not already registered
            let registration;
            const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
            
            if (existingRegistration) {
                console.log('Using existing service worker registration');
                registration = existingRegistration;
            } else {
                console.log('Registering new service worker');
                registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/',
                    updateViaCache: 'none'
                });
            }

            // Get existing token or generate new one
            let token = await getToken(messaging, {
                vapidKey: 'BJ9j4bdUtNCIQtWDls0PqGtSoGW__yJSv4JZSOXzkuKTizgWLsmYC1t4OxiYx4lrpbcNGm1IUobk_8dGLwvycc',
                serviceWorkerRegistration: registration
            });

            if (token) {
                console.log('FCM Token:', token);
                setFcmToken(token);
                
                // Update token in Firestore
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    fcmToken: token,
                    notificationsEnabled: true,
                    lastTokenUpdate: new Date().toISOString()
                });

                // Set up foreground message handler
                onMessage(messaging, (payload) => {
                    console.log('Received foreground message:', payload);
                    
                    // Show notification even when app is in foreground
                    registration.showNotification(payload.notification.title, {
                        body: payload.notification.body,
                        icon: '/ios-icon-192.png',
                        badge: '/ios-icon-192.png',
                        vibrate: [100, 50, 100],
                        data: payload.data,
                        tag: payload.data?.timestamp || Date.now().toString(),
                        renotify: false,
                        requireInteraction: true
                    });
                });
            } else {
                throw new Error('Failed to get FCM token');
            }

        } catch (error) {
            console.error('Error initializing notifications:', error);
            throw error;
        }
    };

    useEffect(() => {
        const checkPermission = async () => {
            if ('Notification' in window) {
                console.log('Current notification permission:', Notification.permission);
                const permission = Notification.permission;
                setNotificationPermission(permission);
                
                if (permission === 'granted') {
                    try {
                        await initializeNotifications();
                    } catch (error) {
                        console.error('Failed to initialize notifications:', error);
                    }
                }
            } else {
                console.error('Notifications not supported in this browser');
            }
        };

        checkPermission();
    }, [auth.currentUser]);

    const requestPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                await initializeNotifications();
            }
            return permission;
        } catch (error) {
            console.error('Error requesting permission:', error);
            throw error;
        }
    };

    return {
        notificationPermission,
        fcmToken,
        requestPermission
    };
};