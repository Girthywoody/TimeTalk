// src/components/NotificationButton.jsx
import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationButton = () => {
    const [isRequesting, setIsRequesting] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const { notificationPermission, requestPermission } = useNotifications();

    useEffect(() => {
        // Check if notifications are supported
        const checkSupport = () => {
            const supported = 'Notification' in window &&
                            'serviceWorker' in navigator &&
                            'PushManager' in window;
            setIsSupported(supported);
            console.log('Notifications supported:', supported);
        };

        checkSupport();
    }, []);

    const handlePermissionRequest = async () => {
        setIsRequesting(true);
        try {
            await requestPermission();
        } catch (error) {
            console.error('Error requesting permission:', error);
            // Show a user-friendly message
            alert('Please enable notifications in your browser settings to receive updates.');
        }
        setIsRequesting(false);
    };

    if (!isSupported) {
        return null; // Don't show button if notifications aren't supported
    }

    return (
        <button
            onClick={handlePermissionRequest}
            disabled={isRequesting || notificationPermission === 'granted'}
            className={`p-2 rounded-full transition-colors ${
                notificationPermission === 'granted'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } flex items-center gap-2`}
        >
            {notificationPermission === 'granted' ? (
                <>
                    <Bell className="w-6 h-6" />
                    <span>Notifications enabled</span>
                </>
            ) : (
                <>
                    <BellOff className="w-6 h-6" />
                    <span>Enable notifications</span>
                </>
            )}
        </button>
    );
};

export default NotificationButton;