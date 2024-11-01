import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Settings } from 'lucide-react';

// Components
import ProfileHeader from './ProfileHeader';
import QuickActions from './QuickActions';
import RelationshipMilestones from './RelationshipMilestones';

// Hooks and Config
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.uid) {
        setLoading(false);
        setError('No user found');
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const profileDoc = await getDoc(userRef);

        if (profileDoc.exists()) {
          setProfileData(profileDoc.data());
          setError(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 w-full py-2 px-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          No profile data available
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Settings Button */}
      <div className="fixed top-4 right-4 z-10">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <ProfileHeader 
          profileData={profileData} 
          onProfileUpdate={handleProfileUpdate}
        />
        
        <QuickActions profileData={profileData} />
        
        <RelationshipMilestones 
          anniversary={profileData.relationship?.anniversary}
          milestones={profileData.relationship?.milestones || []}
        />
      </div>
    </div>
  );
};

export default ProfilePage;