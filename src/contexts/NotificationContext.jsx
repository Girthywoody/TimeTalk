// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { useAuth } from '../hooks/useAuth';
// import MagicBell, { FloatingNotificationInbox } from '@magicbell/magicbell-react';

// const NotificationContext = createContext({
//   notificationPermission: 'default',
//   requestNotificationPermission: () => {},
//   isIOS: false
// });

// export function NotificationProvider({ children }) {
//   const { user } = useAuth();
//   const [notificationPermission, setNotificationPermission] = useState('default');
//   const [isIOS, setIsIOS] = useState(false);

//   useEffect(() => {
//     setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
    
//     if ('Notification' in window) {
//       setNotificationPermission(Notification.permission);
//     }
//   }, []);

//   const requestNotificationPermission = async () => {
//     if (!('Notification' in window)) {
//       console.log('This browser does not support notifications');
//       return;
//     }

//     try {
//       const permission = await Notification.requestPermission();
//       setNotificationPermission(permission);

//       if (permission === 'granted') {
//         await registerPushSubscription();
//       }
//     } catch (error) {
//       console.error('Error requesting notification permission:', error);
//     }
//   };

//   const registerPushSubscription = async () => {
//     try {
//       const registration = await navigator.serviceWorker.ready;
//       const subscription = await registration.pushManager.subscribe({
//         userVisibleOnly: true,
//         applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
//       });
      
//       console.log('Push subscription:', subscription);
//       // Here you would typically send this subscription to your backend
//     } catch (error) {
//       console.error('Error registering push subscription:', error);
//     }
//   };

//   const contextValue = {
//     isIOS,
//     notificationPermission,
//     requestNotificationPermission
//   };

//   const renderMagicBell = () => {
//     if (!user) return null;

//     return (
//       <MagicBell
//         apiKey={import.meta.env.VITE_MAGICBELL_API_KEY}
//         userEmail={user.email}
//         theme={{
//           icon: { borderColor: '#737373' },
//           notification: {
//             default: {
//               backgroundColor: '#ffffff',
//               textColor: '#000000',
//             },
//             unseen: {
//               backgroundColor: '#f3f4f6',
//               textColor: '#000000',
//             },
//           },
//         }}
//       >
//         {(props) => (
//           <FloatingNotificationInbox
//             {...props}
//             placement="bottom-right"
//             defaultIsOpen={false}
//             hideNotificationCount={false}
//           />
//         )}
//       </MagicBell>
//     );
//   };

//   return (
//     <NotificationContext.Provider value={contextValue}>
//       {children}
//       {renderMagicBell()}
//     </NotificationContext.Provider>
//   );
// }

// export const useNotifications = () => useContext(NotificationContext);