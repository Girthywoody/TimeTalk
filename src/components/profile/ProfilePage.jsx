// ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import ProfileHeader from './ProfileHeader';
import QuickActions from './QuickActions';
import RelationshipMilestones from './RelationshipMilestones';
import { Loader2 } from 'lucide-react';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
          setProfileData(profileDoc.data());
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

  const handleProfileUpdate = async (updatedData) => {
    setProfileData(updatedData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg">
          No profile data available. Try logging out and back in.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 space-y-6">
      <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none">
        <div className="p-6">
          <ProfileHeader 
            profileData={profileData} 
            onProfileUpdate={handleProfileUpdate}
          />
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none">
        <QuickActions profileData={profileData} />
      </div>

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