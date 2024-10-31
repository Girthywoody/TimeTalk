import React from 'react';
import { Home, MessageSquare, Calendar, Map, Plus } from 'lucide-react';

export default function Navigation({ currentPage, setCurrentPage }) {
  const buttonClasses = (page) => `
    relative flex-1 flex items-center justify-center p-3
    transition-all duration-300 ease-out
    ${currentPage === page ? 'text-emerald-400' : 'text-gray-400'}
  `;

  const iconClasses = (page) => `
    transition-all duration-300
    ${currentPage === page ? 'scale-110' : 'scale-100'}
  `;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white border-t border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-6">
          <button 
            onClick={() => setCurrentPage('home')}
            className={buttonClasses('home')}
          >
            <Home className={iconClasses('home')} size={24} />
          </button>

          <button 
            onClick={() => setCurrentPage('chat')}
            className={buttonClasses('chat')}
          >
            <MessageSquare className={iconClasses('chat')} size={24} />
          </button>

          <button 
            onClick={() => setCurrentPage('new')}
            className="p-3 bg-emerald-400 rounded-full text-white shadow-lg hover:bg-emerald-500 transition-colors"
          >
            <Plus size={24} />
          </button>

          <button 
            onClick={() => setCurrentPage('calendar')}
            className={buttonClasses('calendar')}
          >
            <Calendar className={iconClasses('calendar')} size={24} />
          </button>

          <button 
            onClick={() => setCurrentPage('map')}
            className={buttonClasses('map')}
          >
            <Map className={iconClasses('map')} size={24} />
          </button>
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-white" />
    </nav>
  );
}