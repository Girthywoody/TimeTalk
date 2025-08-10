import React from 'react';
import { Home, MessageCircle, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDarkMode } from '../context/DarkModeContext';

/**
 * Bottom navigation bar inspired by provided JSON specification.
 * - pill shaped container with blur and shadow
 * - icon only tabs with active/inactive states
 * - safe area inset support
 */
export default function Navigation({ currentPage, setCurrentPage }) {
  const { darkMode } = useDarkMode();

  // tabs configuration matching routes used in MainApp
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'chat', icon: MessageCircle, label: 'Chat', badge: false },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  const handleSelect = (id) => {
    setCurrentPage(id);
  };

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]"
    >
      <div
        className="mx-4 mb-4 flex items-center justify-between rounded-2xl backdrop-blur-md shadow-lg"
        style={{
          backgroundColor: darkMode
            ? 'rgba(17,19,21,0.6)'
            : 'rgba(255,255,255,0.6)'
        }}
      >
        {tabs.map(({ id, icon: Icon, label, badge }) => (
          <motion.button
            key={id}
            onClick={() => handleSelect(id)}
            whileTap={{ scale: 0.95 }}
            className="relative flex-1 flex items-center justify-center h-14"
            aria-label={label}
          >
            <Icon
              size={24}
              className={currentPage === id ? 'text-white' : 'text-[#9AA0A6]'}
              strokeWidth={currentPage === id ? 2.5 : 2}
            />
            {badge && (
              <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-[#FF3B30]" />
            )}
          </motion.button>
        ))}
      </div>
    </motion.nav>
  );
}
