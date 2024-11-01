// SettingsPage.jsx
import React from 'react';
import { ChevronRight, User, Lock, Bell, Palette, Sliders } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        </div>

        {/* Settings List */}
        <div className="space-y-2">
          {settingsItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              onClick={() => !item.isToggle && navigate(item.route)}
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
              </div>
              {item.isToggle ? (
                <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};