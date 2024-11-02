import React from 'react';
import { X, EyeOff, Clock } from 'lucide-react';

const SecretPostModal = ({ isOpen, onClose, onConfirm, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} w-full max-w-md rounded-2xl p-6 shadow-xl border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        {/* Header with back button */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
              darkMode 
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <X size={20} />
            <span>Back</span>
          </button>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Scheduling Options
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <button
            onClick={() => onConfirm(true, true)}
            className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
              darkMode 
                ? 'bg-gray-800 hover:bg-gray-750 border-gray-700 hover:border-blue-500' 
                : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-blue-500'
            } border`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <EyeOff size={24} className="text-purple-500" />
              </div>
              <div>
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                  Completely Hidden
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Post will be hidden until the scheduled time
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onConfirm(false, true)}
            className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
              darkMode 
                ? 'bg-gray-800 hover:bg-gray-750 border-gray-700 hover:border-blue-500' 
                : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-blue-500'
            } border`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <Clock size={24} className="text-blue-500" />
              </div>
              <div>
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                  Subtle Hint
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Show a preview with scheduled time only
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecretPostModal;