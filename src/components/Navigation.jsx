import React from 'react';
import { Home, MessageSquare, Calendar, User } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

export default function Navigation({ currentPage, setCurrentPage }) {
  const { darkMode } = useDarkMode();

  const buttonClasses = (page) => `
    relative flex-1 flex flex-col items-center justify-center py-3
    transition-all duration-300 ease-out group
    ${currentPage === page ? 'text-blue-500' : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}
  `;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className={`${
        darkMode 
          ? 'bg-gray-900/80 border-gray-800' 
          : 'bg-white/80 border-gray-100'
        } backdrop-blur-lg border-t`}>
        <div className="max-w-lg mx-auto flex items-center justify-between px-8">
          {[
            { id: 'home', icon: Home },
            { id: 'chat', icon: MessageSquare },
            { id: 'calendar', icon: Calendar },
            { id: 'profile', icon: User }
          ].map(({ id, icon: Icon }) => (
            <button 
              key={id}
              onClick={() => setCurrentPage(id)}
              className={buttonClasses(id)}
            >
              <div className="relative">
                <Icon 
                  size={24} 
                  className={`transition-all duration-300 ${
                    currentPage === id 
                      ? 'stroke-2' 
                      : `group-hover:${darkMode ? 'text-gray-200' : 'text-gray-600'}`
                  }`}
                />
                {currentPage === id && (
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                  </div>
                )}
              </div>
            </button>
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