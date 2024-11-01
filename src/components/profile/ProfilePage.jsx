import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import ProfileHeader from './ProfileHeader';
import QuickActions from './QuickActions';
import RelationshipMilestones from './RelationshipMilestones';
import { Loader2 } from 'lucide-react';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();


  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        console.log('No user found, stopping fetch');
        setLoading(false);
        return;
      }

      console.log('Fetching profile for user:', user.uid);
      
      try {
        const userRef = doc(db, 'users', user.uid);
        console.log('Fetching document from:', userRef.path);
        
        const profileDoc = await getDoc(userRef);
        console.log('Profile doc exists:', profileDoc.exists(), 'Data:', profileDoc.data());

        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfileData(data);
        } else {
          console.log('No profile document found');
          setError('Profile not found');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        console.log('Setting loading to false');
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
      {/* Profile Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none">
        <div className="p-6">
          <ProfileHeader 
            profileData={profileData} 
            onProfileUpdate={handleProfileUpdate}
          />
          <div className="absolute top-4 right-4">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
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