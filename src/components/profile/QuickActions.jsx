import React from 'react';
import { Gift, Camera, ListTodo, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSpotify } from '../hooks/useSpotify';

const QuickActions = () => {
  const navigate = useNavigate();
  const { lastPlayed, loading } = useSpotify();

  const actions = [
    { 
      icon: Music,
      label: 'Last Played',
      customContent: lastPlayed && (
        <div className="flex items-center space-x-3">
          {lastPlayed.albumArt && (
            <img 
              src={lastPlayed.albumArt} 
              alt={`${lastPlayed.name} album art`}
              className="w-12 h-12 rounded-md"
            />
          )}
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {lastPlayed.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {lastPlayed.artist}
            </p>
          </div>
        </div>
      ),
      bgColor: 'bg-green-500/10 dark:bg-green-500/20',
      textColor: 'text-green-600 dark:text-green-400',
      iconColor: 'text-green-500'
    },
    { 
      icon: ListTodo,
      label: 'Christmas List',
      value: '2024',
      bgColor: 'bg-red-500/10 dark:bg-red-500/20',
      textColor: 'text-red-600 dark:text-red-400',
      iconColor: 'text-red-500',
      onClick: () => navigate('/christmas-list')
    },
    { 
      icon: Gift,
      label: 'Gift Ideas',
      value: 'Seasonal',
      bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      iconColor: 'text-purple-500'
    },
    { 
      icon: Camera,
      label: 'Memories',
      value: 'Monthly',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      iconColor: 'text-emerald-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action) => (
        <div
          key={action.label}
          onClick={action.onClick}
          className={`${action.bgColor} rounded-xl p-6 transition-all duration-200 
            ${action.onClick ? 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer' : ''} group`}
        >
          {action.customContent ? (
            <>
              {loading ? (
                <div className="animate-pulse flex space-x-3">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-md"/>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"/>
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"/>
                  </div>
                </div>
              ) : (
                action.customContent
              )}
            </>
          ) : (
            <>
              <action.icon className={`w-6 h-6 ${action.iconColor} mb-2 
                group-hover:scale-110 transition-transform duration-200`} />
              <p className={`text-lg font-bold ${action.textColor} mb-1`}>
                {action.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {action.label}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuickActions;