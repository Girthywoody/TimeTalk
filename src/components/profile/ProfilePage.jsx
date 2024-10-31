import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import ProfileHeader from './ProfileHeader';
import QuickActions from './QuickActions';
import RelationshipMilestones from './RelationshipMilestones';
import { Loader2 } from 'lucide-react';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true); // Make sure this starts as true
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.uid) {
        setLoading(true); // Keep loading true if no user
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

  // Combined loading check
  if (loading || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Only show error if we have an actual error and we're not loading
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 space-y-6">
      {/* Profile Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none">
        <div className="p-6">
          <ProfileHeader 
            profileData={profileData} 
            onProfileUpdate={handleProfileUpdate}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none">
        <QuickActions profileData={profileData} />
      </div>

      {/* Relationship Milestones */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none">
        <RelationshipMilestones 
          anniversary={profileData.relationship?.anniversary}
          milestones={profileData.relationship?.milestones || []}
        />
      </div>
    </div>
  );
};

export default ProfilePage;