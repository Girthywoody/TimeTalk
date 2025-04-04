// useNotifications.js
import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getMessaging, getToken } from 'firebase/messaging';

export const useNotifications = () => {
    const [notificationPermission, setNotificationPermission] = useState('default');
    const [fcmToken, setFcmToken] = useState(null);
    const [isPWA, setIsPWA] = useState(false);

    // Check if running as PWA
    useEffect(() => {
        const checkPWA = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
            setIsPWA(isStandalone || (isIOS && window.navigator.standalone));
        };
        
        checkPWA();
        window.matchMedia('(display-mode: standalone)').addListener(checkPWA);
    }, []);

    const initializeNotifications = async () => {
        if (!auth.currentUser) return;

        try {
            // Check if running as PWA
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator.standalone === true);
            
            if (!isPWA) {
                throw new Error('PWA_REQUIRED');
            }

            // Request permission
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            
            if (permission !== 'granted') {
                throw new Error('PERMISSION_DENIED');
            }

            // Initialize messaging and get registration
            const messaging = getMessaging();
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/',
                updateViaCache: 'none'
            });

            // Get FCM token
            const token = await getToken(messaging, {
                vapidKey: 'BJ9j4bdUtNCIQtWDls0PqGtSoGW__yJSv4JZSOXzkuKTizgWLsmYC1t4OxiYx4lrpbcNGm1IUobk_8dGLwvycc',
                serviceWorkerRegistration: registration
            });

            if (!token) {
                throw new Error('FAILED_TOKEN_GENERATION');
            }

            setFcmToken(token);

            // Update token in Firestore
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                fcmToken: token,
                notificationsEnabled: true,
                lastTokenUpdate: new Date().toISOString()
            });

            return token;

        } catch (error) {
            console.error('Error initializing notifications:', error);
            throw error;
        }
    };

    const debugServiceWorker = async () => {
        try {
            // Check if service worker is supported
            if (!('serviceWorker' in navigator)) {
                throw new Error('Service Worker not supported');
            }

            // Check registration
            const registration = await navigator.serviceWorker.getRegistration();
            console.log('Current registration:', registration);
            
            if (!registration) {
                throw new Error('No Service Worker registration found');
            }

            // Check service worker state
            const serviceWorker = registration.active || registration.installing || registration.waiting;
            console.log('Service Worker state:', serviceWorker?.state);

            // Check push manager
            const subscription = await registration.pushManager.getSubscription();
            console.log('Push subscription:', subscription);

            // Test notification
            await registration.showNotification('Debug Test', {
                body: 'Testing notification system',
                icon: '/ios-icon-192.png',
                badge: '/ios-icon-192.png'
            });

            return true;
        } catch (error) {
            console.error('Service Worker debug failed:', error);
            throw error;
        }
    };

    // Test notification function
    const testNotification = async () => {
        try {
            // Initialize notifications first
            const token = await initializeNotifications();
            
            if (!token) {
                throw new Error('NO_TOKEN');
            }

            const idToken = await auth.currentUser.getIdToken(true);
            
            // Send test notification through your backend
            const response = await fetch('https://us-central1-timetalk-13a75.cloudfunctions.net/api/sendNotification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    userId: auth.currentUser.uid,
                    notification: {
                        title: 'Test Notification',
                        body: `Test message sent at ${new Date().toLocaleTimeString()}`,
                        data: {
                            type: 'test',
                            timestamp: Date.now().toString(),
                            url: '/',
                            clickAction: '/'
                        }
                    }
                })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to send notification');
            }

            return true;
        } catch (error) {
            console.error('Test notification error:', error);
            throw error;
        }
    };

    return {
        notificationPermission,
        fcmToken,
        isPWA,
        initializeNotifications,
        testNotification
    };
};