import React, { useState } from 'react';
import { Calendar, Heart, Camera, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ProfileHeader = ({ profileData, onProfileUpdate }) => {
  const [uploading, setUploading] = useState(false);

  const handlePhotoClick = () => {
    document.getElementById('profile-photo-input').click();
  };

  const getDaysTogether = () => {
    if (!profileData.relationship?.anniversary) return 0;
    const anniversary = new Date(profileData.relationship.anniversary);
    const today = new Date();
    return Math.floor((today - anniversary) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100/50 to-purple-100/50 opacity-50" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col items-center space-y-6 px-4 pt-8 pb-6"
      >
        {/* Profile Photo */}
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 p-1 shadow-xl">
            <div className="w-full h-full rounded-2xl overflow-hidden relative backdrop-blur-sm bg-white/90">
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              <img 
                src={profileData.profilePhotoURL || "/api/placeholder/128/128"}
                alt={profileData.displayName} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <button 
            onClick={handlePhotoClick}
            className="absolute -bottom-2 -right-2 bg-white rounded-xl p-2.5 shadow-lg 
              hover:bg-gray-50 transition-colors disabled:opacity-50 border border-gray-100"
            disabled={uploading}
          >
            <Camera size={20} className="text-gray-600" />
          </button>
          <input
            type="file"
            id="profile-photo-input"
            className="hidden"
            accept="image/*"
            disabled={uploading}
          />
        </motion.div>

        {/* Profile Info */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {profileData.displayName}
            </h2>
            <p className="text-gray-500 text-sm">@{profileData.username}</p>
          </motion.div>

          {profileData.bio && (
            <motion.p 
              className="text-gray-600 max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {profileData.bio}
            </motion.p>
          )}

          {/* Relationship Info */}
          <motion.div 
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {profileData.relationship?.anniversary && (
              <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-blue-50 text-blue-600">
                <Calendar size={16} />
                <span>Together since {new Date(profileData.relationship.anniversary).toLocaleDateString()}</span>
              </div>
            )}

            {profileData.partnerInfo?.name && (
              <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-rose-50 text-rose-600">
                <Heart size={16} />
                <span>With {profileData.partnerInfo.name}</span>
                {profileData.partnerInfo.nickname && (
                  <span className="text-rose-400">({profileData.partnerInfo.nickname})</span>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-3 gap-8 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-center p-4 rounded-2xl backdrop-blur-sm bg-white/80 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{profileData.stats?.memories || 0}</p>
            <p className="text-sm text-gray-600">Memories</p>
          </div>
          <div className="text-center p-4 rounded-2xl backdrop-blur-sm bg-white/80 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-purple-600">{profileData.stats?.scheduled || 0}</p>
            <p className="text-sm text-gray-600">Planned</p>
          </div>
          <div className="text-center p-4 rounded-2xl backdrop-blur-sm bg-white/80 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-rose-600">{getDaysTogether()}</p>
            <p className="text-sm text-gray-600">Days</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProfileHeader;