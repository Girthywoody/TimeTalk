import React from 'react';
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
    <>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-700">Our Milestones</h2>
      </div>
      <div className="p-4 pt-0">
        <div className="space-y-4">
          {allMilestones.map((milestone, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-4 p-4 rounded-xl bg-${milestone.color}-50`}
            >
              <div className={`w-12 h-12 rounded-full bg-${milestone.color}-100 flex items-center justify-center`}>
                {milestone.icon && <milestone.icon className={`text-${milestone.color}-500`} size={24} />}
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
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default RelationshipMilestones;