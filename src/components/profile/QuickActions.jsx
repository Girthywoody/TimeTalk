// src/components/profile/QuickActions.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Calendar, Gift, Camera } from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      icon: Heart,
      label: 'Send Love Note',
      gradient: 'from-rose-500 to-pink-500'
    },
    {
      icon: Calendar,
      label: 'Plan Date',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      icon: Gift,
      label: 'Gift Ideas',
      gradient: 'from-purple-500 to-violet-500'
    },
    {
      icon: Camera,
      label: 'Add Memory',
      gradient: 'from-emerald-500 to-green-500'
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
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`p-4 rounded-xl bg-gradient-to-r ${action.gradient} text-white font-medium 
              hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2`}
          >
            <action.icon size={20} />
            {action.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;