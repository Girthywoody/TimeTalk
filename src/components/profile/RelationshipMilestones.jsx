import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Calendar, Lock } from 'lucide-react';

const RelationshipMilestones = ({ anniversary, milestones = [] }) => {
  const defaultMilestones = [
    {
      title: 'First Connected',
      date: anniversary,
      icon: Heart,
      color: 'blue'
    },
    {
      title: 'Relationship Status',
      date: anniversary,
      icon: Lock,
      color: 'purple'
    }
  ];

  const allMilestones = [...defaultMilestones, ...milestones];

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Our Journey</h2>
      <div className="space-y-6">
        {allMilestones.map((milestone, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-4 p-4 rounded-2xl backdrop-blur-sm 
              bg-white/80 border border-gray-100 shadow-sm hover:shadow-md 
              transition-all duration-200 group`}
          >
            <div className={`w-16 h-16 rounded-xl bg-${milestone.color}-100 flex items-center 
              justify-center group-hover:scale-110 transition-transform duration-200`}>
              {milestone.icon && <milestone.icon className={`text-${milestone.color}-500`} size={28} />}
            </div>
            <div>
              <h3 className="font-medium text-gray-800">{milestone.title}</h3>
              <p className="text-sm text-gray-600">
                {new Date(milestone.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RelationshipMilestones;