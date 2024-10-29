import React from 'react';
import { Heart, Calendar } from 'lucide-react';

const QuickActions = () => (
  <>
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-700">Quick Actions</h2>
    </div>
    <div className="p-4 pt-0">
      <div className="grid grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:shadow-lg transition-all duration-200">
          <Heart size={20} />
          Send Love Note
        </button>
        <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all duration-200">
          <Calendar size={20} />
          Plan Date
        </button>
      </div>
    </div>
  </>
);

export default QuickActions;