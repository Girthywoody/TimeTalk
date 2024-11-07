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

                // Handle foreground messages with deduplication
                onMessage(messaging, (payload) => {
                    console.log('Received foreground message:', payload);
                    
                    // Check if we've already processed this message
                    if (processedMessageIds.has(payload.messageId)) {
                        console.log('Duplicate message prevented:', payload.messageId);
                        return;
                    }

                    // Add message ID to processed set
                    processedMessageIds.add(payload.messageId);

                    // Clear message ID after 5 seconds
                    setTimeout(() => {
                        processedMessageIds.delete(payload.messageId);
                    }, 5000);

                    // Only show notification if app is not visible
                    if (document.visibilityState !== 'visible') {
                        registration.showNotification(payload.notification.title, {
                            body: payload.notification.body,
                            icon: '/ios-icon-192.png',
                            badge: '/ios-icon-192.png',
                            tag: payload.messageId, // Use messageId as tag
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