import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, MessageCircle, Heart, Calendar, Gift, Loader2 } from 'lucide-react';
import SettingsPage from '../profile/SettingsPage';  // Add this line



const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const handleProfileUpdate = (updatedData) => {
    setProfileData(updatedData);
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        console.log('No user found, stopping fetch');
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const profileDoc = await getDoc(userRef);
        
        if (profileDoc.exists()) {      
          const data = profileDoc.data();
          setProfileData(data);
        } else {
          setError('Profile not found');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const getDaysTogether = () => {
    if (!profileData?.relationship?.anniversary) return 0;
    const anniversary = new Date(profileData.relationship.anniversary);
    const today = new Date();
    return Math.floor((today - anniversary) / (1000 * 60 * 60 * 24));
  };

  const stats = [
    { label: 'Messages', value: profileData?.stats?.messages || 0, color: 'text-blue-500' },
    { label: 'Moments', value: profileData?.stats?.moments || 0, color: 'text-purple-500' },
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-yellow-500/10 text-yellow-400 p-4 rounded-lg">
          No profile data available. Try logging out and back in.
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 min-h-screen bg-black">
      <div className="max-w-md mx-auto h-full flex flex-col">
        {/* Header with Settings */}
        <div className="flex justify-between items-center p-6">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 px-6 pb-6 space-y-6 overflow-y-auto">
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
                <h2 className="text-xl font-bold text-white">{profileData.displayName}</h2>
                <p className="text-gray-400">@{profileData.username}</p>
              </div>

              {/* Relationship Info */}
              <div className="flex flex-col items-center gap-2 w-full">
                {profileData.relationship?.anniversary && (
                  <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-blue-500/10">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400">Together since {new Date(profileData.relationship.anniversary).toLocaleDateString()}</span>
                  </div>
                )}
                {profileData.partnerInfo?.name && (
                  <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-rose-500/10">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400">With {profileData.partnerInfo.name}</span>
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
                className="bg-gray-900/50 rounded-2xl p-4 text-center"
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
                className={`${metric.bgColor} rounded-2xl p-4`}
              >
                <metric.icon className={`w-6 h-6 ${metric.textColor} mb-2`} />
                <p className={`text-lg font-bold ${metric.textColor}`}>{metric.value}</p>
                <p className="text-sm text-gray-400">{metric.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div> 
      {showSettings && (
        <SettingsPage 
          onClose={() => setShowSettings(false)} 
          profileData={{
            ...profileData,
            onProfileUpdate: handleProfileUpdate  // Add this function
          }}
        />
      )}
    </div>
);
};

export default ProfilePage;