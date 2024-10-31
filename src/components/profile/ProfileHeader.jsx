import React, { useState } from 'react';
import { Calendar, Heart, Camera, Loader2 } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import EditableBio from './EditableBio';


const ProfileHeader = ({ profileData, onProfileUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const storage = getStorage();
  

  const handleBioUpdate = (newBio) => {
    if (onProfileUpdate) {
      onProfileUpdate({
        ...profileData,
        bio: newBio
      });
    }
  };

  // Calculate days together if anniversary exists
  const getDaysTogether = () => {
    if (!profileData.relationship?.anniversary) return 0;
    const anniversary = new Date(profileData.relationship.anniversary);
    const today = new Date();
    return Math.floor((today - anniversary) / (1000 * 60 * 60 * 24));
  };

  const handlePhotoClick = () => {
    document.getElementById('profile-photo-input').click();
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);

      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, `profile-photos/${user.uid}/${file.name}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update the user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePhotoURL: downloadURL
      });

      // Update local state through parent component
      if (onProfileUpdate) {
        onProfileUpdate({
          ...profileData,
          profilePhotoURL: downloadURL
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      // Here you might want to show an error message to the user
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1">
          <div className="w-full h-full rounded-full overflow-hidden relative">
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <img 
              src={profileData.profilePhotoURL || "/api/placeholder/96/96"}
              alt={profileData.displayName} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {/* Camera icon overlay */}
        <button 
          onClick={handlePhotoClick}
          className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          disabled={uploading}
        >
          <Camera size={16} className="text-gray-600" />
        </button>
        {/* Hidden file input */}
        <input
          type="file"
          id="profile-photo-input"
          className="hidden"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={uploading}
        />
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">{profileData.displayName}</h2>
        <p className="text-gray-600 text-sm">@{profileData.username}</p>
        {profileData.bio && (
                  <EditableBio 
                  initialBio={profileData.bio}
                  onBioUpdate={handleBioUpdate}
                 />
        )}
        {profileData.relationship?.anniversary && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Calendar size={16} className="text-blue-500" />
            <span>Together since {new Date(profileData.relationship.anniversary).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}</span>
          </div>
        )}
        {profileData.partnerInfo?.name && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Heart size={16} className="text-rose-500" />
            <span>With {profileData.partnerInfo.name}</span>
            {profileData.partnerInfo.nickname && (
              <span className="text-gray-400">({profileData.partnerInfo.nickname})</span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-8 w-full max-w-xs">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{profileData.stats?.memories || 0}</p>
          <p className="text-sm text-gray-600">Memories</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{profileData.stats?.scheduled || 0}</p>
          <p className="text-sm text-gray-600">Scheduled</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{getDaysTogether()}</p>
          <p className="text-sm text-gray-600">Days Together</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;