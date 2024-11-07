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
            const messaging = getMessaging();
            
            // Request permission first
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Notification permission denied');
            }

            // Register service worker
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/',
                updateViaCache: 'none'
            });
            
            console.log('Service Worker registered:', registration);

            onMessage(messaging, (payload) => {
                console.log('Received foreground message:', payload);
                
                if (document.visibilityState !== 'visible') {
                    const notificationId = payload.data?.timestamp || Date.now().toString();
                    
                    if (processedMessageIds.has(notificationId)) {
                        console.log('Duplicate notification prevented:', notificationId);
                        return;
                    }

                    processedMessageIds.add(notificationId);
                    setTimeout(() => processedMessageIds.delete(notificationId), 5000);

                    registration.showNotification(payload.notification.title, {
                        body: payload.notification.body,
                        icon: '/ios-icon-192.png',
                        badge: '/ios-icon-192.png',
                        vibrate: [100, 50, 100],
                        data: payload.data,
                        tag: notificationId,
                        renotify: false
                    });
                }
            });

            const token = await getToken(messaging, {
                vapidKey: 'BJ9j4bdUtNCIQtWDls0PqGtSoGW__yJSv4JZSOXzkuKTizgWLsmYC1t4OxiYx4lrpbcNGm1IUobk_8dGLwvycc',
                serviceWorkerRegistration: registration
            });

            if (token) {
                console.log('FCM Token:', token);
                setFcmToken(token);
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    fcmToken: token,
                    notificationsEnabled: true,
                    lastTokenUpdate: new Date().toISOString()
                });
            } else {
                throw new Error('No FCM token received');
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