import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Settings, MessageCircle, Heart, Calendar, Gift, Camera, Loader2 } from 'lucide-react';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
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

  const handleProfileUpdate = (updatedData) => {
    setProfileData(updatedData);
  };

  const getDaysTogether = () => {
    if (!profileData?.relationship?.anniversary) return 0;
    const anniversary = new Date(profileData.relationship.anniversary);
    const today = new Date();
    return Math.floor((today - anniversary) / (1000 * 60 * 60 * 24));
  };

  const stats = [
    { label: 'Messages', value: profileData?.stats?.messages || 0, Icon: MessageCircle, color: 'text-blue-500' },
    { label: 'Moments', value: profileData?.stats?.moments || 0, Icon: Camera, color: 'text-purple-500' },
    { label: 'Days', value: getDaysTogether(), Icon: Calendar, color: 'text-rose-500' }
  ];

  const quickMetrics = [
    { 
      icon: MessageCircle,
      value: profileData?.stats?.newMessages || '0',
      label: 'New Messages',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    { 
      icon: Heart,
      value: profileData?.stats?.sharedMoments || '0',
      label: 'Shared Moments',
      bgColor: 'bg-rose-500/10 dark:bg-rose-500/20',
      textColor: 'text-rose-600 dark:text-rose-400'
    },
    { 
      icon: Calendar,
      value: profileData?.stats?.upcomingDates || '0',
      label: 'Upcoming Dates',
      bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    { 
      icon: Gift,
      value: profileData?.stats?.wishListItems || '0',
      label: 'Wish List Items',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      textColor: 'text-emerald-600 dark:text-emerald-400'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 p-4 rounded-lg">
          No profile data available. Try logging out and back in.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Section */}
        <div className="flex flex-col items-center space-y-6">
          {/* Profile Photo */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1">
              <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-900">
                <img
                  src={profileData.profilePhotoURL || "/api/placeholder/128/128"}
                  alt={profileData.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <button className="absolute bottom-0 right-0 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
              <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData.displayName}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">@{profileData.username}</p>
            </div>

            {/* Relationship Status */}
            {(profileData.relationship?.anniversary || profileData.partnerInfo?.name) && (
              <div className="flex flex-wrap justify-center gap-2">
                {profileData.relationship?.anniversary && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Calendar className="w-4 h-4" />
                    <span>Together since {new Date(profileData.relationship.anniversary).toLocaleDateString()}</span>
                  </div>
                )}
                {profileData.partnerInfo?.name && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Heart className="w-4 h-4" />
                    <span>With {profileData.partnerInfo.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-800">
              <stat.Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {quickMetrics.map((metric) => (
            <div key={metric.label} className={`${metric.bgColor} rounded-xl p-6`}>
              <metric.icon className={`w-6 h-6 ${metric.textColor} mb-2`} />
              <p className={`text-lg font-bold ${metric.textColor}`}>{metric.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPage 
          onClose={() => setShowSettings(false)} 
          profileData={{
            ...profileData,
            onProfileUpdate: handleProfileUpdate
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;