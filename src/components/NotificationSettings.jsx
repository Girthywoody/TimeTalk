// import React, { useState, useEffect } from 'react';
// import { useNotifications } from '../contexts/NotificationContext';
// import { useAuth } from '../hooks/useAuth';
// import { Bell, BellOff, MessageSquare, Calendar, Heart, Clock, X } from 'lucide-react';
// import { doc, getDoc, setDoc } from 'firebase/firestore';
// import { db } from '../firebase';

// const NotificationSettings = () => {
//   const { user } = useAuth();
//   const { notificationPermission, requestNotificationPermission, isIOS } = useNotifications();
//   const [settings, setSettings] = useState({
//     messages: true,
//     calendar: true,
//     timeline: true,
//     scheduled: true
//   });
//   const [loading, setLoading] = useState(true);
//   const [saved, setSaved] = useState(false);

//   useEffect(() => {
//     const loadSettings = async () => {
//       if (!user) return;

//       try {
//         const settingsDoc = await getDoc(doc(db, 'userSettings', user.uid));
//         if (settingsDoc.exists()) {
//           setSettings(settingsDoc.data().notifications || {});
//         }
//       } catch (error) {
//         console.error('Error loading notification settings:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadSettings();
//   }, [user]);

//   const handleToggle = (setting) => {
//     setSettings(prev => ({
//       ...prev,
//       [setting]: !prev[setting]
//     }));
//     setSaved(false);
//   };

//   const saveSettings = async () => {
//     if (!user) return;

//     try {
//       await setDoc(doc(db, 'userSettings', user.uid), {
//         notifications: settings
//       }, { merge: true });
//       setSaved(true);
//       setTimeout(() => setSaved(false), 2000);
//     } catch (error) {
//       console.error('Error saving notification settings:', error);
//     }
//   };

//   const notificationOptions = [
//     {
//       key: 'messages',
//       label: 'Chat Messages',
//       description: 'Get notified when you receive new messages',
//       icon: MessageSquare
//     },
//     {
//       key: 'calendar',
//       label: 'Calendar Events',
//       description: 'Receive reminders about upcoming events',
//       icon: Calendar
//     },
//     {
//       key: 'timeline',
//       label: 'Timeline Updates',
//       description: 'Get notified about new posts and reactions',
//       icon: Heart
//     },
//     {
//       key: 'scheduled',
//       label: 'Scheduled Posts',
//       description: 'Receive notifications when scheduled posts are published',
//       icon: Clock
//     }
//   ];

//   if (loading) {
//     return (
//       <div className="p-4 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-6 max-w-2xl mx-auto">
//       {/* Header */}
//       <div className="mb-6">
//         <h2 className="text-2xl font-bold text-gray-800">Notification Settings</h2>
//         <p className="text-gray-600 mt-1">Manage how you want to be notified</p>
//       </div>

//       {/* Browser Permission Status */}
//       <div className="mb-6">
//         <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
//           <div className="flex items-center gap-3">
//             {notificationPermission === 'granted' ? (
//               <Bell className="text-blue-500" size={24} />
//             ) : (
//               <BellOff className="text-gray-400" size={24} />
//             )}
//             <div>
//               <h3 className="font-medium text-gray-800">Browser Notifications</h3>
//               <p className="text-sm text-gray-600">
//                 {notificationPermission === 'granted'
//                   ? 'Notifications are enabled'
//                   : 'Enable notifications in your browser'}
//               </p>
//             </div>
//           </div>
//           {notificationPermission !== 'granted' && !isIOS && (
//             <button
//               onClick={requestNotificationPermission}
//               className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
//             >
//               Enable
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Notification Types */}
//       <div className="space-y-4">
//         {notificationOptions.map(({ key, label, description, icon: Icon }) => (
//           <div key={key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
//             <div className="flex items-center gap-3">
//               <Icon className="text-gray-600" size={20} />
//               <div>
//                 <h3 className="font-medium text-gray-800">{label}</h3>
//                 <p className="text-sm text-gray-600">{description}</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 className="sr-only peer"
//                 checked={settings[key]}
//                 onChange={() => handleToggle(key)}
//               />
//               <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
//             </label>
//           </div>
//         ))}
//       </div>

//       {/* Save Button */}
//       <div className="mt-6 flex justify-end">
//         {saved && (
//           <div className="mr-4 flex items-center text-green-600">
//             <span className="text-sm">Settings saved!</span>
//           </div>
//         )}
//         <button
//           onClick={saveSettings}
//           className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
//         >
//           Save Changes
//         </button>
//       </div>
//     </div>
//   );
// };

// export default NotificationSettings;