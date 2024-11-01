import React from 'react';
import { Settings, MessageCircle, Heart, Calendar, Gift, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ModernProfile = ({ profileData }) => {
  const getDaysTogether = () => {
    if (!profileData.relationship?.anniversary) return 0;
    const anniversary = new Date(profileData.relationship.anniversary);
    const today = new Date();
    return Math.floor((today - anniversary) / (1000 * 60 * 60 * 24));
  };
  const [showSettings, setShowSettings] = useState(false);

  const stats = [
    { label: 'Messages', value: profileData.stats?.messages || 0, color: 'text-blue-500' },
    { label: 'Moments', value: profileData.stats?.moments || 0, color: 'text-purple-500' },
    { label: 'Days', value: getDaysTogether(), color: 'text-rose-500' }
  ];

  const quickMetrics = [
    { 
      icon: MessageCircle,
      value: '24',
      label: 'New Messages',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500'
    },
    { 
      icon: Heart,
      value: '12',
      label: 'Shared Moments',
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-500'
    },
    { 
      icon: Calendar,
      value: '3',
      label: 'Upcoming Dates',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-500'
    },
    { 
      icon: Gift,
      value: '2',
      label: 'Wish List Items',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header with Settings */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img
                    src={profileData.profilePhotoURL || "/api/placeholder/96/96"}
                    alt={profileData.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-bold">{profileData.displayName}</h2>
              <p className="text-gray-400">@{profileData.username}</p>
            </div>

            {/* Relationship Info */}
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-blue-500/10 text-blue-400">
                <Calendar className="w-4 h-4" />
                <span>Together since {new Date(profileData.relationship?.anniversary).toLocaleDateString()}</span>
              </div>
              {profileData.partnerInfo?.name && (
                <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-rose-500/10 text-rose-400">
                  <Heart className="w-4 h-4" />
                  <span>With {profileData.partnerInfo.name}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900/50 rounded-2xl p-4 text-center backdrop-blur-sm"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {quickMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`${metric.bgColor} rounded-2xl p-4 backdrop-blur-sm`}
            >
              <metric.icon className={`w-6 h-6 ${metric.textColor} mb-2`} />
              <p className={`text-lg font-bold ${metric.textColor}`}>{metric.value}</p>
              <p className="text-sm text-gray-400">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
      {showSettings && (
        <SettingsPage onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default ModernProfile;