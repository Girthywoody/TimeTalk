import React from 'react';
import { X, EyeOff, Clock, ArrowLeft } from 'lucide-react';

const SecretPostModal = ({ isOpen, onClose, onConfirm, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`w-full max-w-md transform transition-all duration-300 ease-out scale-100
          ${darkMode ? 'bg-gray-900' : 'bg-white'} 
          rounded-2xl shadow-xl border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={onClose}
              className={`p-2 rounded-full transition-colors hover:scale-105 transform
                ${darkMode 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Schedule Post
            </h2>
          </div>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} ml-12`}>
            Choose how you'd like your post to appear
          </p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {/* Completely Hidden Option */}
          <button
            onClick={() => onConfirm(true, true)}
            className={`w-full p-5 rounded-xl text-left transition-all duration-200 transform hover:scale-[1.02]
              ${darkMode 
                ? 'bg-gray-800 hover:bg-gray-750 border-purple-500/20 hover:border-purple-500' 
                : 'bg-gray-50 hover:bg-white border-purple-200 hover:border-purple-500'
              } border-2 relative overflow-hidden group`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                darkMode ? 'bg-purple-500/10' : 'bg-purple-50'
              } group-hover:scale-110 transition-transform duration-200`}>
                <EyeOff size={26} className="text-purple-500" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                  Completely Hidden
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your post will be invisible until the scheduled time, creating a perfect surprise
                </p>
              </div>
            </div>
          </button>

          {/* Subtle Hint Option */}
          <button
            onClick={() => onConfirm(false, true)}
            className={`w-full p-5 rounded-xl text-left transition-all duration-200 transform hover:scale-[1.02]
              ${darkMode 
                ? 'bg-gray-800 hover:bg-gray-750 border-blue-500/20 hover:border-blue-500' 
                : 'bg-gray-50 hover:bg-white border-blue-200 hover:border-blue-500'
              } border-2 relative overflow-hidden group`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                darkMode ? 'bg-blue-500/10' : 'bg-blue-50'
              } group-hover:scale-110 transition-transform duration-200`}>
                <Clock size={26} className="text-blue-500" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                  Subtle Hint
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Shows a preview with the scheduled time, building anticipation
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Bottom Note */}
        <div className={`p-6 pt-2 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
          You can always edit or delete your scheduled post later
        </div>
      </div>
    </div>
  );
};

export default SecretPostModal;