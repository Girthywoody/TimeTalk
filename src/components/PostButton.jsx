import React from 'react';
import { Send, Clock } from 'lucide-react';

const PostButton = ({ isScheduleMode, onScheduleModeChange, onPost, isDisabled, darkMode }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onScheduleModeChange(!isScheduleMode)}
        className={`p-3 rounded-xl flex items-center gap-2 transition-colors
          ${darkMode 
            ? isScheduleMode 
              ? 'bg-gray-700 text-blue-400' 
              : 'bg-gray-800 text-gray-400 hover:text-gray-300' 
            : isScheduleMode 
              ? 'bg-blue-50 text-blue-500' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
      >
        <Clock size={20} />
        {isScheduleMode && (
          <span className="text-sm font-medium">Schedule</span>
        )}
      </button>

      <button
        onClick={() => onPost(isScheduleMode)}
        disabled={isDisabled}
        className={`px-6 py-3 rounded-xl flex items-center gap-2 
          transition-all duration-200 hover:transform hover:scale-105
          ${isDisabled
            ? `${darkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
            : isScheduleMode
              ? `${darkMode 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'}`
              : `${darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}`
          }`}
      >
        <Send size={20} />
        {isScheduleMode ? 'Schedule Post' : 'Post Now'}
      </button>
    </div>
  );
};

export default PostButton;