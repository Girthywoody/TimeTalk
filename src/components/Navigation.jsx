import React from 'react';
import { Home, MessageSquare, Calendar, User } from 'lucide-react';

export default function Navigation({ currentPage, setCurrentPage }) {
  const buttonClasses = (page) => `
    relative flex-1 flex flex-col items-center justify-center py-3
    transition-all duration-300 ease-out group
    ${currentPage === page ? 'text-blue-500' : 'text-gray-400'}
  `;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/80 backdrop-blur-lg border-t border-gray-100">
        <div className="max-w-lg mx-auto flex items-center justify-between px-8">
          <button 
            onClick={() => setCurrentPage('home')}
            className={buttonClasses('home')}
          >
            <div className="relative">
              <Home 
                size={24} 
                className={`transition-all duration-300 ${
                  currentPage === 'home' 
                    ? 'stroke-2' 
                    : 'group-hover:text-gray-600'
                }`}
              />
              {currentPage === 'home' && (
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                </div>
              )}
            </div>
          </button>

          <button 
            onClick={() => setCurrentPage('chat')}
            className={buttonClasses('chat')}
          >
            <div className="relative">
              <MessageSquare 
                size={24} 
                className={`transition-all duration-300 ${
                  currentPage === 'chat' 
                    ? 'stroke-2' 
                    : 'group-hover:text-gray-600'
                }`}
              />
              {currentPage === 'chat' && (
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                </div>
              )}
            </div>
          </button>

          <button 
            onClick={() => setCurrentPage('calendar')}
            className={buttonClasses('calendar')}
          >
            <div className="relative">
              <Calendar 
                size={24} 
                className={`transition-all duration-300 ${
                  currentPage === 'calendar' 
                    ? 'stroke-2' 
                    : 'group-hover:text-gray-600'
                }`}
              />
              {currentPage === 'calendar' && (
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                </div>
              )}
            </div>
          </button>

          <button 
            onClick={() => setCurrentPage('profile')}
            className={buttonClasses('profile')}
          >
            <div className="relative">
              <User 
                size={24} 
                className={`transition-all duration-300 ${
                  currentPage === 'profile' 
                    ? 'stroke-2' 
                    : 'group-hover:text-gray-600'
                }`}
              />
              {currentPage === 'profile' && (
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-white/80 backdrop-blur-lg" />
    </nav>
  );
}