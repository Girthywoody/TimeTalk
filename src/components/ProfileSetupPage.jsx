import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Calendar, Heart, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const ProfileSetupPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileData, setProfileData] = useState({
    displayName: '',
    profileImage: null,
    bio: '',
    partnerInfo: {
      name: ''
    },
    relationship: {
      anniversary: ''
    }
  });

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          profileImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!profileData.displayName.trim()) {
      setError('Display name is required');
      return;
    }
  
    try {
      setLoading(true);
      setError('');
      console.log('Starting profile creation...');
  
      let profilePhotoURL = null;
  
      // Only try to upload image if one was selected
      if (profileData.profileImage) {
        try {
          console.log('Uploading profile image...');
          const imageRef = ref(storage, `profiles/${user.uid}`);
          await uploadString(imageRef, profileData.profileImage, 'data_url');
          profilePhotoURL = await getDownloadURL(imageRef);
          console.log('Image uploaded successfully');
        } catch (imageError) {
          console.error('Image upload failed:', imageError);
          // Continue with profile creation even if image upload fails
        }
      }
  
      // Create the profile document
      const userRef = doc(db, 'users', user.uid);
      const profileDoc = {
        displayName: profileData.displayName.trim(),
        profilePhotoURL, // Will be null if image upload failed
        bio: profileData.bio.trim(),
        partnerInfo: {
          name: profileData.partnerInfo.name.trim()
        },
        relationship: {
          anniversary: profileData.relationship.anniversary
        },
        stats: {
          memories: 0,
          scheduled: 0,
          daysConnected: 0
        },
        createdAt: new Date().toISOString(),
        userId: user.uid,
        email: user.email
      };
  
      console.log('Creating profile document:', profileDoc);
      await setDoc(userRef, profileDoc);
      console.log('Profile created successfully');
  
      // Verify the profile was created
      const verifyDoc = await getDoc(doc(db, 'users', user.uid));
      if (verifyDoc.exists()) {
        console.log('Profile verified, redirecting to home');
        window.location.href = '/';
      } else {
        throw new Error('Profile creation could not be verified');
      }
  
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create profile. Please try again. Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-8">
          <button
            onClick={handleBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Login
          </button>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Create Your Profile</h2>

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Profile Image Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-32 h-32">
                <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    {profileData.profileImage ? (
                      <img 
                        src={profileData.profileImage}
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Camera className="text-gray-400" size={40} />
                      </div>
                    )}
                  </div>
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full shadow-lg cursor-pointer hover:bg-blue-600 transition-colors">
                  <Camera className="text-white" size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageCapture}
                  />
                </label>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your display name"
                value={profileData.displayName}
                onChange={(e) => setProfileData(prev => ({...prev, displayName: e.target.value}))}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                placeholder="Write a short bio..."
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({...prev, bio: e.target.value}))}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32"
              />
              <input
                type="text"
                placeholder="Partner's name"
                value={profileData.partnerInfo.name}
                onChange={(e) => setProfileData(prev => ({
                  ...prev, 
                  partnerInfo: {...prev.partnerInfo, name: e.target.value}
                }))}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex items-center gap-3">
                <Calendar className="text-gray-400" size={20} />
                <input
                  type="date"
                  placeholder="Anniversary"
                  value={profileData.relationship.anniversary}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev, 
                    relationship: {...prev.relationship, anniversary: e.target.value}
                  }))}
                  className="flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl
                      flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Complete Setup
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;