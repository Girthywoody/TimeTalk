import React from 'react';
import { Gift, MessageCircle, Calendar, Camera, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const QuickActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const actions = [
    {
      icon: Gift,
      label: 'Christmas List',
      onClick: () => navigate(`/christmas-list/${user.uid}`),
      enabled: true
    },
    {
      icon: Zap,
      label: "Sync'd",
      onClick: () => navigate('/syncd'),
      enabled: true
    },
    {
      icon: MessageCircle,
      label: 'Coming Soon',
      onClick: () => {},
      enabled: false
    },
    {
      icon: Calendar,
      label: 'Coming Soon',
      onClick: () => {},
      enabled: false
    },
    {
      icon: Camera,
      label: 'Coming Soon',
      onClick: () => {},
      enabled: false
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          disabled={!action.enabled}
          className={`bg-white dark:bg-gray-900 rounded-xl p-6 text-center border 
            border-gray-200 dark:border-gray-800 transition-colors
            ${action.enabled 
              ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer' 
              : 'opacity-50 cursor-not-allowed'}`}
        >
          <action.icon className="w-6 h-6 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{action.label}</p>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;