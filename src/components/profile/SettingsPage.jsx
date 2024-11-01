// src/profile/SettingsPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Lock, Bell, Palette, Sliders } from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  
  // Prevent background scrolling when settings is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
  const settingsItems = [
    { icon: User, label: 'Account Details', route: '/settings/account' },
    { icon: Lock, label: 'Change password', route: '/settings/password' },
    { icon: Bell, label: 'Notifications', route: '/settings/notifications' },
    { icon: Palette, label: 'Light / Dark mode', route: '/settings/theme', isToggle: true },
    { icon: Sliders, label: 'Preferences', route: '/settings/preferences' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div 
        className="min-h-screen overflow-y-auto"
        style={{ 
          animation: 'slideInRight 300ms ease-out',
          WebkitOverflowScrolling: 'touch' // For iOS momentum scrolling
        }}
      >
        <style>
          {`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }
          `}
        </style>
        
        {/* iOS Safe Area Top Spacing */}
        <div className="safe-area-top h-[env(safe-area-inset-top)]" />
        
        <div className="max-w-md mx-auto p-6">
          {/* Header - Fixed position */}
          <div className="sticky top-0 z-10 bg-white pb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
            </div>
          </div>

          {/* Settings List */}
          <div className="space-y-3 mt-4">
            {settingsItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => !item.isToggle && navigate(item.route)}
              >
                <div className="flex items-center gap-4">
                  <item.icon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">{item.label}</span>
                </div>
                {item.isToggle ? (
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      value="" 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                ) : (
                  <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* iOS Safe Area Bottom Spacing */}
        <div className="safe-area-bottom h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
};

export default SettingsPage;