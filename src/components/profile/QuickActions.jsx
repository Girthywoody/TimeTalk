import React from 'react';
import { Heart, Calendar, Gift, Camera } from 'lucide-react';

const QuickActions = () => {
  const actions = [
    { 
      icon: Heart,
      label: 'Send Love',
      value: 'Daily',
      bgColor: 'bg-rose-500/10 dark:bg-rose-500/20',
      textColor: 'text-rose-600 dark:text-rose-400',
      iconColor: 'text-rose-500'
    },
    { 
      icon: Calendar,
      label: 'Plan Date',
      value: 'Weekly',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      iconColor: 'text-blue-500'
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
        <button
          key={action.label}
          className={`${action.bgColor} rounded-xl p-6 transition-all duration-200 
            hover:scale-[1.02] active:scale-[0.98] group`}
        >
          <action.icon className={`w-6 h-6 ${action.iconColor} mb-2 
            group-hover:scale-110 transition-transform duration-200`} />
          <p className={`text-lg font-bold ${action.textColor} mb-1`}>
            {action.value}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {action.label}
          </p>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;