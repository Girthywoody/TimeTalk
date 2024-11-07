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

                // Handle foreground messages
                onMessage(messaging, (payload) => {
                    console.log('Received foreground message:', payload);
                    
                    // Only show notification if the app is not focused
                    if (document.visibilityState !== 'visible') {
                        const notificationId = payload.data?.timestamp || Date.now().toString();
                        
                        // Check if we've already shown this notification
                        if (processedMessageIds.has(notificationId)) {
                            console.log('Duplicate notification prevented:', notificationId);
                            return;
                        }

                        // Add to set of processed messages
                        processedMessageIds.add(notificationId);

                        // Clear old messages from the set after 5 seconds
                        setTimeout(() => {
                            processedMessageIds.delete(notificationId);
                        }, 5000);

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

                try {
                    const token = await getToken(messaging, {
                        vapidKey: 'BJ9j4bdUtNCIQtWDls0PqGtSoGW__yJSv4JZSOXzkuKTizgWLsmYC1t4OoxiYx4lrpbcNGm1IUobk_8dGLwvycc',
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
                    }
                } catch (tokenError) {
                    console.error('Error getting FCM token:', tokenError);
                }
            }
        } catch (error) {
            console.error('Error initializing notifications:', error);
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