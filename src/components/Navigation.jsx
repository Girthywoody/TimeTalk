import React from 'react';
import { Home, MessageSquare, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDarkMode } from '../context/DarkModeContext';

export default function Navigation({ currentPage, setCurrentPage }) {
  const { darkMode } = useDarkMode();
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      const isKeyboard = window.innerHeight < window.outerHeight * 0.75;
      setIsKeyboardVisible(isKeyboard);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tabs = [
    { id: 'home', icon: Home },
    { id: 'chat', icon: MessageSquare },
    { id: 'calendar', icon: Calendar },
    { id: 'profile', icon: User }
  ];

  const buttonClasses = (page) => `
    relative flex-1 flex flex-col items-center justify-center py-3
    transition-all duration-300 ease-out group
    ${currentPage === page ? 'text-brand-500' : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}
  `;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
      isKeyboardVisible ? 'translate-y-full' : 'translate-y-0'
    }`}>
      <div className={`${
        darkMode
          ? 'bg-dark-800/80 border-dark-700'
          : 'bg-white/80 border-brand-100'
        } backdrop-blur-lg border-t`}>
        <div className="relative max-w-lg mx-auto flex items-center justify-between px-8">
          {tabs.map(({ id, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setCurrentPage(id)}
              className={buttonClasses(id)}
              whileTap={{ scale: 0.9 }}
              animate={{ scale: currentPage === id ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {currentPage === id && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full bg-brand-100 dark:bg-dark-700"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                size={24}
                className={`relative z-10 transition-colors duration-300 ${
                  currentPage === id
                    ? 'stroke-2'
                    : `group-hover:${darkMode ? 'text-gray-200' : 'text-gray-600'}`
                }`}
              />
            </motion.button>
          ))}
        </div>
      </div>
      <div className={`h-[env(safe-area-inset-bottom)] ${
        darkMode
          ? 'bg-gray-900/80'
          : 'bg-white/80'
        } backdrop-blur-lg`} />
    </nav>
  );
}