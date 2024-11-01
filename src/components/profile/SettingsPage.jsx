import React from 'react';
import { 
  ArrowLeft, 
  Edit2, 
  ArrowRight,
  User,
  Lock,
  Bell,
  Palette,
  Sliders
} from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';

const SettingsPage = ({ onClose }) => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  const menuItems = [
    { icon: User, label: 'Account Details' },
    { icon: Lock, label: 'Change password' },
    { icon: Bell, label: 'Notifications' },
    { icon: Sliders, label: 'Preferences' },
  ];

  return (
    <div className="fixed inset-0 z-50 min-h-screen">
      <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Edit2 className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center px-4 py-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-100">
              <img
                src="/api/placeholder/80/80"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
              <Edit2 className="w-4 h-4 text-white" />
            </button>
          </div>
          <h2 className="mt-4 text-2xl font-semibold">Mark Adams</h2>
          <p className="text-gray-500 dark:text-gray-400">mark.adams@gmail.fr</p>
        </div>

        {/* Settings List */}
        <div className="px-4 space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center justify-between p-4 rounded-xl ${
                darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gray-400" />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {item.label}
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
          
          {/* Theme Mode Toggle */}
          <div className={`w-full flex items-center justify-between p-4 rounded-xl`}>
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-gray-400" />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Theme mode
              </span>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;