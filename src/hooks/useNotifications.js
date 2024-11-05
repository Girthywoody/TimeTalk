import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth, requestNotificationPermission } from '../firebase';

export const useNotifications = () => {
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [fcmToken, setFcmToken] = useState(null);

    useEffect(() => {
        let unsubscribe = () => {};

        const initializeNotifications = async () => {
            if (!auth.currentUser) return;

            try {
                // Request permission and get token
                const token = await requestNotificationPermission();
                if (token) {
                    setFcmToken(token);
                    
                    // Store token in Firestore
                    const userRef = doc(db, 'users', auth.currentUser.uid);
                    const userDoc = await getDoc(userRef);
                    
                    if (userDoc.exists()) {
                        await updateDoc(userRef, {
                            fcmToken: token,
                            notificationsEnabled: true,
                            lastTokenUpdate: new Date().toISOString()
                        });
                    } else {
                        await setDoc(userRef, {
                            fcmToken: token,
                            notificationsEnabled: true,
                            lastTokenUpdate: new Date().toISOString()
                        });
                    }
                }
            } catch (error) {
                console.error('Error initializing notifications:', error);
            }
        };

        initializeNotifications();
        return () => unsubscribe();
    }, []);

    return {
        notificationPermission,
        fcmToken
    };
};