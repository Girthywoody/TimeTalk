// ProfileHeader.jsx
import React, { useState, useRef } from 'react';
import { Camera, X, Check, Edit2, Loader2 } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

const ProfileHeader = ({ profileData, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editedData, setEditedData] = useState(profileData);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const storage = getStorage();

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `profile-photos/${user.uid}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePhotoURL: downloadURL
      });

      if (onProfileUpdate) {
        onProfileUpdate({
          ...profileData,
          profilePhotoURL: downloadURL
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: editedData.displayName,
        username: editedData.username,
        bio: editedData.bio
      });

      onProfileUpdate(editedData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col items-center space-y-6">
        {/* Profile Photo */}
        <div className="relative group">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1">
            <div className="w-full h-full rounded-full overflow-hidden relative group-hover:opacity-90 transition-opacity">
              <img 
                src={profileData.profilePhotoURL || "/api/placeholder/128/128"}
                alt={profileData.displayName} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Camera size={24} className="text-white" />
              </div>
            </div>
          </div>
          <button 
            onClick={handlePhotoClick}
            className="absolute bottom-1 right-1 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          >
            <Camera size={16} className="text-gray-600" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handlePhotoChange}
          />
        </div>

        {/* Profile Info */}
        <div className="text-center space-y-4 w-full max-w-md">
          {isEditing ? (
            <div className="space-y-4">
              <input
                value={editedData.displayName}
                onChange={(e) => setEditedData({ ...editedData, displayName: e.target.value })}
                className="w-full text-center text-xl font-bold bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Display Name"
              />
              <input
                value={editedData.username}
                onChange={(e) => setEditedData({ ...editedData, username: e.target.value })}
                className="w-full text-center bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Username"
              />
              <textarea
                value={editedData.bio}
                onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                className="w-full text-center bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Write a bio..."
                rows={3}
              />
              <div className="flex justify-center gap-2">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  onClick={handleSaveProfile}
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsEditing(true)}
                className="absolute -right-8 top-0 p-2 text-gray-400 hover:text-gray-600"
              >
                <Edit2 size={16} />
              </button>
              <h2 className="text-2xl font-bold text-gray-800">{profileData.displayName}</h2>
              <p className="text-gray-600">@{profileData.username}</p>
              {profileData.bio && (
                <p className="text-gray-600 mt-2">{profileData.bio}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-8 grid grid-cols-3 gap-8 w-full max-w-md mx-auto">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{profileData.stats?.memories || 0}</p>
          <p className="text-sm text-gray-600">Memories</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{profileData.stats?.scheduled || 0}</p>
          <p className="text-sm text-gray-600">Scheduled</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {Math.floor((new Date() - new Date(profileData.relationship?.anniversary)) / (1000 * 60 * 60 * 24))}
          </p>
          <p className="text-sm text-gray-600">Days Together</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;