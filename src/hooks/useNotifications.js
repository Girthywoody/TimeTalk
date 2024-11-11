import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth, messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';

export const useNotifications = () => {
    const [permission, setPermission] = useState('default');
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);

    // Initialize notifications
    const initialize = useCallback(async () => {
        try {
            setLoading(true);

            // Check PWA status
            const isPWA = window.matchMedia('(display-mode: standalone)').matches;
            if (!isPWA) {
                throw new Error('Please install the app to enable notifications');
            }

            // Request permission if needed
            if (Notification.permission !== 'granted') {
                const newPermission = await Notification.requestPermission();
                setPermission(newPermission);
                if (newPermission !== 'granted') {
                    throw new Error('Notification permission denied');
                }
            }

            // Register service worker
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/',
                updateViaCache: 'none'
            });

            // Get FCM token
            const fcmToken = await getToken(messaging, {
                vapidKey: 'BJ9j4bdUtNCIQtWDls0PqGtSoGW__yJSv4JZSOXzkuKTizgWLsmYC1t4OxiYx4lrpbcNGm1IUobk_8dGLwvycc',
                serviceWorkerRegistration: registration
            });

            if (!fcmToken) {
                throw new Error('Failed to get notification token');
            }

            setToken(fcmToken);

            // Update token in Firestore
            if (auth.currentUser) {
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    fcmToken,
                    notificationsEnabled: true,
                    lastTokenUpdate: new Date().toISOString()
                });
            }

            return fcmToken;
        } catch (error) {
            console.error('Error initializing notifications:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Send notification
    const sendNotification = async (userId, notification) => {
        try {
            const idToken = await auth.currentUser.getIdToken(true);
            const response = await fetch('https://us-central1-timetalk-13a75.cloudfunctions.net/api/sendNotification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ userId, notification })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to send notification');
            }

            return result;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    };

    // Handle foreground messages
    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            // Show custom notification for foreground messages
            if (Notification.permission === 'granted') {
                const { title, body } = payload.notification;
                new Notification(title, {
                    body,
                    icon: '/ios-icon-192.png',
                    badge: '/ios-icon-192.png',
                    data: payload.data
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return {
        permission,
        token,
        loading,
        initialize,
        sendNotification
    };
};