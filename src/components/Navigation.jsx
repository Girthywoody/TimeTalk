import React from 'react';
import { Calendar, Map, Home, MessageSquare, User } from 'lucide-react';

export default function Navigation({ currentPage, setCurrentPage }) {
  const buttonClasses = (page) => `
    relative flex-1 h-16 flex items-center justify-center
    transition-all duration-300 ease-out
    ${currentPage === page ? 'transform -translate-y-2' : ''}
  `;

  const iconClasses = (page) => `
    transition-all duration-300
    ${currentPage === page ? 'text-blue-500 scale-125' : 'text-gray-600'}
  `;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white border-t border-gray-200">
        <div 
          className="relative max-w-2xl mx-auto flex items-center justify-between px-4 h-16"
        >
          <button 
            data-page="calendar"
            onClick={() => setCurrentPage('calendar')}
            className={buttonClasses('calendar')}
          >
            <Calendar className={iconClasses('calendar')} size={24} />
          </button>

          <button 
            data-page="map"
            onClick={() => setCurrentPage('map')}
            className={buttonClasses('map')}
          >
            <Map className={iconClasses('map')} size={24} />
          </button>

          <button 
            data-page="home"
            onClick={() => setCurrentPage('home')}
            className={buttonClasses('home')}
          >
            <Home className={iconClasses('home')} size={28} />
          </button>

          <button 
            data-page="chat"
            onClick={() => setCurrentPage('chat')}
            className={buttonClasses('chat')}
          >
            <MessageSquare className={iconClasses('chat')} size={24} />
          </button>

          <button 
            data-page="profile"
            onClick={() => setCurrentPage('profile')}
            className={buttonClasses('profile')}
          >
            <User className={iconClasses('profile')} size={24} />
          </button>
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-white" />
    </nav>
  );
}