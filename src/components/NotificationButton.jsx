// src/components/NotificationButton.jsx
import React, { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationButton = () => {
    const [isRequesting, setIsRequesting] = useState(false);
    const { notificationPermission } = useNotifications();

    const handlePermissionRequest = async () => {
        setIsRequesting(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                // Permission granted, notification setup will happen in useNotifications
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
        }
        setIsRequesting(false);
    };

    return (
        <button
            onClick={handlePermissionRequest}
            disabled={isRequesting || notificationPermission === 'granted'}
            className={`p-2 rounded-full transition-colors ${
                notificationPermission === 'granted'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
            {notificationPermission === 'granted' ? (
                <Bell className="w-6 h-6" />
            ) : (
                <BellOff className="w-6 h-6" />
            )}
        </button>
    );
};

export default NotificationButton;