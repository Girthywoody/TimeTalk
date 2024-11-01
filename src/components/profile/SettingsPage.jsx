import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Lock, Bell, Palette, Sliders } from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  
  const settingsItems = [
    { icon: User, label: 'Account Details', route: '/settings/account' },
    { icon: Lock, label: 'Change password', route: '/settings/password' },
    { icon: Bell, label: 'Notifications', route: '/settings/notifications' },
    { icon: Palette, label: 'Light / Dark mode', route: '/settings/theme', isToggle: true },
    { icon: Sliders, label: 'Preferences', route: '/settings/preferences' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-b from-blue-50 to-white"
      style={{ 
        animation: 'slideInRight 300ms ease-out',
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
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full bg-white/90 shadow-sm"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        </div>

        {/* Settings List */}
        <div className="space-y-3">
          {settingsItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => !item.isToggle && navigate(item.route)}
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">{item.label}</span>
              </div>
              {item.isToggle ? (
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    id={`toggle-${index}`}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;