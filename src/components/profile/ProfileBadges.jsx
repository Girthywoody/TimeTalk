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
      color: 'rose'
    },
    {
      icon: Calendar,
      label: 'Dedicated Planner',
      description: 'Scheduled 10+ dates',
      color: 'blue'
    },
    {
      icon: Star,
      label: 'Memory Maker',
      description: 'Created 50+ memories',
      color: 'amber'
    },
    {
      icon: Award,
      label: 'Anniversary Pro',
      description: 'Never missed an important date',
      color: 'purple'
    }
  ];

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
            className={`flex items-center gap-3 p-3 rounded-lg bg-${badge.color}-50`}
          >
            <div className={`w-10 h-10 rounded-full bg-${badge.color}-100 flex items-center justify-center`}>
              <badge.icon className={`w-5 h-5 text-${badge.color}-500`} />
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