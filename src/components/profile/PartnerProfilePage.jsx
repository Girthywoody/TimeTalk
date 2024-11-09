import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Heart, Calendar, Camera, Loader2, Gift } from 'lucide-react';

const PartnerProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { userId } = useParams();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userRef = doc(db, 'users', userId);
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
  }, [userId]);

  const getDaysTogether = () => {
    if (!profileData?.relationship?.anniversary) return 0;
    const anniversary = new Date(profileData.relationship.anniversary);
    const today = new Date();
    return Math.floor((today - anniversary) / (1000 * 60 * 60 * 24));
  };

  const handleBackClick = () => {
    navigate('/');
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header with Back Button */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={handleBackClick}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {profileData?.displayName}'s Profile
          </h1>
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
                  src={profileData?.profilePhotoURL || "/api/placeholder/128/128"}
                  alt={profileData?.displayName || "Profile"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData?.displayName}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                @{profileData?.username}
              </p>
            </div>

            {/* Bio */}
            {profileData?.bio && (
              <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                {profileData.bio}
              </p>
            )}

            {/* Relationship Status */}
            {profileData?.relationship?.anniversary && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Calendar className="w-4 h-4" />
                  <span>Together since {new Date(profileData.relationship.anniversary).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Heart className="w-4 h-4" />
                  <span>With {profileData?.partnerInfo?.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-800">
            <MessageCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-500">{profileData?.stats?.messages || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-800">
            <Camera className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-500">{profileData?.stats?.memories || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Moments</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-800">
            <Calendar className="w-6 h-6 text-rose-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-rose-500">{getDaysTogether()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Days Together</p>
          </div>
          <button
            onClick={() => navigate(`/christmas-list/${userId}`)}
            className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center border 
              border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 
              transition-colors"
          >
            <Gift className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Christmas List</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerProfilePage; 