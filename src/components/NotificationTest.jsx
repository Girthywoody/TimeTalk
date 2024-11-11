import React, { useState, useEffect } from 'react';
import { Loader2, Bell } from 'lucide-react';
import { auth, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';

const NotificationTest = () => {
    const [loading, setLoading] = useState(false);
    const [permission, setPermission] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check initial permission state
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const initializeNotifications = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check if we're in a PWA
            const isPWA = window.matchMedia('(display-mode: standalone)').matches;
            if (!isPWA) {
                throw new Error('Please install the app to enable notifications');
            }

            // Request permission if needed
            if (Notification.permission !== 'granted') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    throw new Error('Notification permission denied');
                }
                setPermission(permission);
            }

            // Register service worker
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
                throw new Error('Failed to get notification token');
            }

            // Send test notification
            const idToken = await auth.currentUser.getIdToken(true);
            const response = await fetch('https://us-central1-timetalk-13a75.cloudfunctions.net/api/sendNotification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    userId: auth.currentUser.uid, // Sending to self for testing
                    notification: {
                        title: 'Test Notification',
                        body: 'If you see this, notifications are working! 🎉',
                        data: {
                            type: 'test',
                            timestamp: Date.now().toString()
                        }
                    }
                })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to send test notification');
            }

        } catch (error) {
            console.error('Notification test failed:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={initializeNotifications}
                disabled={loading || permission === 'denied'}
                className={`p-2 rounded-full transition-colors flex items-center gap-2
                    ${loading 
                        ? 'bg-gray-100 cursor-not-allowed' 
                        : permission === 'granted'
                            ? 'bg-green-100 text-green-600'
                            : permission === 'denied'
                                ? 'bg-red-100 text-red-600 cursor-not-allowed'
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Bell className="w-5 h-5" />
                )}
                <span className="text-sm">
                    {loading ? 'Testing...' : 
                     permission === 'granted' ? 'Notifications Enabled' :
                     permission === 'denied' ? 'Notifications Blocked' :
                     'Test Notifications'}
                </span>
            </button>
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default NotificationTest;