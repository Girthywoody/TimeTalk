// src/components/profile/QuickActions.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Calendar, Gift, Camera } from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      icon: Heart,
      label: 'Send Love',
      gradient: 'from-rose-400 to-pink-400',
      bgHover: 'hover:bg-rose-50'
    },
    {
      icon: Calendar,
      label: 'Plan Date',
      gradient: 'from-blue-400 to-indigo-400',
      bgHover: 'hover:bg-blue-50'
    },
    {
      icon: Gift,
      label: 'Gift Ideas',
      gradient: 'from-purple-400 to-violet-400',
      bgHover: 'hover:bg-purple-50'
    },
    {
      icon: Camera,
      label: 'Memory',
      gradient: 'from-emerald-400 to-green-400',
      bgHover: 'hover:bg-emerald-50'
    }
  ];

  return (
    <div className="px-6 py-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-2xl backdrop-blur-sm bg-white/80 border border-gray-100
              shadow-lg shadow-gray-100/50 hover:shadow-xl transition-all duration-200 
              flex flex-col items-center justify-center gap-3 group ${action.bgHover}`}
          >
            <div className={`p-3 rounded-xl bg-gradient-to-r ${action.gradient} 
              text-white group-hover:scale-110 transition-transform duration-200`}>
              <action.icon size={24} />
            </div>
            <span className="font-medium text-gray-700">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;