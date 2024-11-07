import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export const useNotifications = () => {
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [fcmToken, setFcmToken] = useState(null);

    useEffect(() => {
        const initializeNotifications = async () => {
            if (!auth.currentUser) return;

            try {
                // Check if the browser supports service workers
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                        scope: '/',
                        updateViaCache: 'none'
                    });
                    console.log('Service Worker registered with scope:', registration.scope);

                    const permission = await Notification.requestPermission();
                    setNotificationPermission(permission);
                    console.log('Notification permission:', permission);

                    if (permission === 'granted') {
                        const messaging = getMessaging();
                        
                        // Handle foreground messages
                        onMessage(messaging, (payload) => {
                            console.log('Received foreground message:', payload);
                            registration.showNotification(payload.notification.title, {
                                body: payload.notification.body,
                                icon: '/ios-icon-192.png',
                                badge: '/ios-icon-192.png',
                                vibrate: [100, 50, 100],
                                data: payload.data
                            });
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
                } else {
                    console.log('Service workers are not supported');
                }
            } catch (error) {
                console.error('Error initializing notifications:', error);
            }
        };

        initializeNotifications();

        // Cleanup function
        return () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.unregister();
                    });
                });
            }
        };
    }, [auth.currentUser]);

    return {
        notificationPermission,
        fcmToken
    };
};