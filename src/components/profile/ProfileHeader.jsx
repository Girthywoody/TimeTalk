import React, { useState, useRef } from 'react';
import { Camera, Edit2, Check, X, Loader2, Calendar, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import ImageCropper from './ImageCropper';
import toast from 'react-hot-toast';

const ProfileHeader = ({ profileData, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editedData, setEditedData] = useState(profileData);
  const [cropImage, setCropImage] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const storage = getStorage();

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (blob) => {
    if (!user) return;

    try {
      setUploading(true);
      const fileName = `profile-${Date.now()}.jpg`;
      const storageRef = ref(storage, `profile-photos/${user.uid}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePhotoURL: downloadURL
      });

      onProfileUpdate({
        ...profileData,
        profilePhotoURL: downloadURL
      });

      toast.success('Profile photo updated!');
      setCropImage(null);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to update profile photo');
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
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <>
      <div className="relative max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center space-y-6"
        >
          {/* Profile Photo */}
          <motion.div 
            className="relative group"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1">
              <div className="w-full h-full rounded-full overflow-hidden relative group-hover:opacity-90 transition-opacity">
                <img 
                  src={profileData.profilePhotoURL || "/api/placeholder/128/128"}
                  alt={profileData.displayName} 
                  className="w-full h-full object-cover"
                />
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/30 flex items-center justify-center"
                >
                  <Camera size={24} className="text-white" />
                </motion.div>
              </div>
            </div>
            <motion.button 
              onClick={handlePhotoClick}
              className="absolute bottom-1 right-1 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Camera size={16} className="text-gray-600" />
            </motion.button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handlePhotoSelect}
            />
          </motion.div>

          {/* Profile Info */}
          <div className="text-center space-y-4 w-full max-w-md">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
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
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      onClick={() => setIsEditing(false)}
                    >
                      <X size={16} />
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2"
                      onClick={handleSaveProfile}
                    >
                      <Check size={16} />
                      Save Changes
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative"
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsEditing(true)}
                    className="absolute -right-8 top-0 p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 size={16} />
                  </motion.button>
                  <h2 className="text-2xl font-bold text-gray-800">{profileData.displayName}</h2>
                  <p className="text-gray-600">@{profileData.username}</p>
                  {profileData.bio && (
                    <p className="text-gray-600 mt-2">{profileData.bio}</p>
                  )}
                  
                  {/* Relationship Info */}
                  {profileData.relationship?.anniversary && (
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600">
                      <Calendar size={16} className="text-blue-500" />
                      <span>Together since {new Date(profileData.relationship.anniversary).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>
                  )}
                  {profileData.partnerInfo?.name && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-600">
                      <Heart size={16} className="text-rose-500" />
                      <span>With {profileData.partnerInfo.name}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid grid-cols-3 gap-8 w-full max-w-md mx-auto"
        >
          <div className="text-center">
          <motion.p 
              className="text-2xl font-bold text-blue-600"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {profileData.stats?.memories || 0}
            </motion.p>
            <p className="text-sm text-gray-600">Memories</p>
          </div>
          <div className="text-center">
            <motion.p 
              className="text-2xl font-bold text-blue-600"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            >
              {profileData.stats?.scheduled || 0}
            </motion.p>
            <p className="text-sm text-gray-600">Scheduled</p>
          </div>
          <div className="text-center">
            <motion.p 
              className="text-2xl font-bold text-blue-600"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
            >
              {Math.floor((new Date() - new Date(profileData.relationship?.anniversary)) / (1000 * 60 * 60 * 24))}
            </motion.p>
            <p className="text-sm text-gray-600">Days Together</p>
          </div>
        </motion.div>
      </div>

      {/* Image Cropper Dialog */}
      {cropImage && (
        <ImageCropper
          image={cropImage}
          onComplete={handleCropComplete}
          onCancel={() => setCropImage(null)}
        />
      )}
    </>
  );
};

// src/components/profile/ProfileBadges.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Award, Heart, Calendar, Star } from 'lucide-react';

const ProfileBadges = ({ achievements }) => {
  const badges = [
    {
      icon: Heart,
      label: 'Perfect Match',
      description: 'Completed relationship profile',
      color: 'rose'
    },
    {
      icon: Calendar,
      label: 'Dedicated Planner',
      description: 'Scheduled 10+ dates',
      color: 'blue'
    },
    {
      icon: Star,
      label: 'Memory Maker',
      description: 'Created 50+ memories',
      color: 'amber'
    },
    {
      icon: Award,
      label: 'Anniversary Pro',
      description: 'Never missed an important date',
      color: 'purple'
    }
  ];

  return (
    <div className="px-6 py-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Achievements</h3>
      <div className="grid grid-cols-2 gap-4">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-3 p-3 rounded-lg bg-${badge.color}-50`}
          >
            <div className={`w-10 h-10 rounded-full bg-${badge.color}-100 flex items-center justify-center`}>
              <badge.icon className={`w-5 h-5 text-${badge.color}-500`} />
            </div>
            <div>
              <p className="font-medium text-gray-800">{badge.label}</p>
              <p className="text-sm text-gray-600">{badge.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// src/components/profile/QuickActions.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Calendar, Gift, Camera } from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      icon: Heart,
      label: 'Send Love Note',
      color: 'rose',
      gradient: 'from-rose-500 to-pink-500'
    },
    {
      icon: Calendar,
      label: 'Plan Date',
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      icon: Gift,
      label: 'Gift Ideas',
      color: 'purple',
      gradient: 'from-purple-500 to-violet-500'
    },
    {
      icon: Camera,
      label: 'Add Memory',
      color: 'emerald',
      gradient: 'from-emerald-500 to-green-500'
    }
  ];

  return (
    <div className="px-6 py-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`p-4 rounded-xl bg-gradient-to-r ${action.gradient} text-white font-medium 
              hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2`}
          >
            <action.icon size={20} />
            {action.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Update your ProfilePage.jsx to include these new components:
const ProfilePage = () => {
  // ... existing code ...

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none"
      >
        <div className="p-6">
          <ProfileHeader 
            profileData={profileData} 
            onProfileUpdate={handleProfileUpdate}
          />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none"
      >
        <QuickActions />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none"
      >
        <ProfileBadges achievements={profileData.achievements} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none"
      >
        <RelationshipMilestones 
          anniversary={profileData.relationship?.anniversary}
          milestones={profileData.relationship?.milestones || []}
        />
      </motion.div>
    </div>
  );
};