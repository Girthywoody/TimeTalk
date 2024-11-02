import React from 'react';
import { Clock, Lock } from 'lucide-react';

const ScheduledPostPreview = ({ post, darkMode }) => {
  return (
    <div className="relative group">
      <div className={`absolute inset-0 ${
        darkMode 
          ? 'bg-gradient-to-b from-dark-700/80 to-dark-800/80' 
          : 'bg-gradient-to-b from-gray-100/80 to-gray-200/80'
        } backdrop-blur-sm rounded-lg flex items-center justify-center z-10`}>
        <div className="text-center p-6 transform transition-all duration-300 group-hover:scale-105">
          {/* User Avatar and Schedule Info */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {post.authorPhotoUrl ? (
                <img 
                  src={post.authorPhotoUrl} 
                  alt={post.author} 
                  className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold
                  ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-100 text-blue-600'}`}>
                  {post.author[0]}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                <Clock size={16} className="text-blue-500" />
              </div>
            </div>
            
            <div>
              <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>
                {post.author}
              </p>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>
                Scheduled for: {post.scheduledForFormatted}
              </p>
            </div>

            <div className={`mt-2 flex items-center justify-center gap-2 px-3 py-1 rounded-full 
              ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
              <Lock size={14} />
              <span className="text-sm">Content hidden</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Blurred Background */}
      <div className="filter blur-sm pointer-events-none">
        <div className="p-6">
          <div className={`h-6 ${darkMode ? 'bg-dark-700' : 'bg-gray-200'} rounded w-1/3 mb-4`}></div>
          <div className="space-y-2">
            <div className={`h-4 ${darkMode ? 'bg-dark-700' : 'bg-gray-200'} rounded w-full`}></div>
            <div className={`h-4 ${darkMode ? 'bg-dark-700' : 'bg-gray-200'} rounded w-2/3`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledPostPreview;