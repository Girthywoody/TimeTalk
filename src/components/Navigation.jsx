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
    <nav className="fixed inset-x-5 bottom-5 z-50">
      <div
        className="h-[72px] p-[14px] rounded-[28px] flex items-center justify-between shadow-[0_8px_22px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        style={{
          backgroundColor: darkMode ? '#0F1113' : '#111315'
        }}
      >
        {tabs.map(({ id, icon: Icon, label, badge }) => (
          <motion.button
            key={id}
            onClick={() => handleSelect(id)}
            whileTap={{ scale: 0.9 }}
            className="relative flex-1 flex items-center justify-center"
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
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
