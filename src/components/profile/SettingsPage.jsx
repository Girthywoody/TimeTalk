// src/components/profile/SettingsPage.jsx
import React from 'react';
import { Moon, Sun, ArrowLeft } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className={`p-4 flex items-center justify-between border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={() => navigate(-1)}
          className={`p-2 rounded-full ${
            darkMode 
              ? 'hover:bg-gray-800 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold">Settings</h1>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Settings Content */}
      <div className="p-4 space-y-4">
        {/* Dark Mode Toggle */}
        <div className={`p-4 rounded-lg ${
          darkMode ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="text-blue-400" /> : <Sun className="text-yellow-500" />}
              <div>
                <h3 className="font-medium">Appearance</h3>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </p>
              </div>
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

        {/* Add more settings sections here */}
      </div>
    </div>
  );
};

export default SettingsPage;