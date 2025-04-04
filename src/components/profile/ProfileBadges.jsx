// src/components/profile/ProfileBadges.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Award, Heart, Calendar, Star } from 'lucide-react';

const ProfileBadges = ({ achievements }) => {
  const badges = [
    {
      icon: Heart,
      label: 'Perfect Match',
      description: 'Completed relationship profile',
      bgColor: 'bg-rose-50',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-500'
    },
    {
      icon: Calendar,
      label: 'Dedicated Planner',
      description: 'Scheduled 10+ dates',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500'
    },
    {
      icon: Star,
      label: 'Memory Maker',
      description: 'Created 50+ memories',
      bgColor: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-500'
    },
    {
      icon: Award,
      label: 'Anniversary Pro',
      description: 'Never missed an important date',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-500'
    }
  ];

// Replace in ProfileBadges.jsx
return (
  <div className="px-6 py-4">
    <h3 className="text-lg font-semibold text-gray-700 mb-4">Achievements</h3>
    <div className="grid grid-cols-2 gap-4">
      {badges.map((badge, index) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-center gap-4 p-4 rounded-2xl backdrop-blur-sm 
            bg-white/80 border border-gray-100 shadow-sm hover:shadow-md 
            transition-all duration-200 group ${badge.bgColor}`}
        >
          <div className={`w-12 h-12 rounded-xl ${badge.iconBg} flex items-center 
            justify-center group-hover:scale-110 transition-transform duration-200`}>
            <badge.icon className={`w-6 h-6 ${badge.iconColor}`} />
          </div>
          <div>
            <p className="font-medium text-gray-800">{badge.label}</p>
            <p className="text-sm text-gray-600">{badge.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);
};

export default ProfileBadges;