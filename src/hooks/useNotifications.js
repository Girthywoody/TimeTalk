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
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/',
                    updateViaCache: 'none'
                });
                console.log('Service Worker registered:', registration);

                const messaging = getMessaging();

                // Request permission first
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    throw new Error('Notification permission denied');
                }

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
            }
        } catch (error) {
            console.error('Error initializing notifications:', error);
            throw error;
        }
    };

    useEffect(() => {
        const checkPermission = async () => {
            if ('Notification' in window) {
                const permission = Notification.permission;
                setNotificationPermission(permission);
                
                if (permission === 'granted') {
                    await initializeNotifications();
                }
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