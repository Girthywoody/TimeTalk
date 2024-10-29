// import React from 'react';
// import { Bell } from 'lucide-react';
// import { useNotifications } from '../contexts/NotificationContext';

// const NotificationButton = () => {
//   const { notificationPermission, requestNotificationPermission } = useNotifications();

//   const handleClick = async () => {
//     if (notificationPermission !== 'granted') {
//       await requestNotificationPermission();
//     }
//   };

//   return (
//     <button
//       onClick={handleClick}
//       className={`p-2 rounded-full transition-all duration-200 ${
//         notificationPermission === 'granted'
//           ? 'bg-blue-500 text-white hover:bg-blue-600'
//           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//       }`}
//     >
//       <Bell size={20} />
//     </button>
//   );
// };

// export default NotificationButton;