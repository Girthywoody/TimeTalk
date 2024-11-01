import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Edit2, 
  ArrowRight,
  User,
  Lock,
  Bell,
  Palette,
  Sliders,
  Camera,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '../../context/DarkModeContext';
import { storage, db, auth } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const SettingsPage = ({ onClose, profileData }) => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({
    displayName: profileData?.displayName || '',
    username: profileData?.username || '',
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);
      
      // Create a unique file name
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `profile-pictures/${auth.currentUser.uid}/${fileName}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update Firestore document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        profilePhotoURL: downloadURL
      });

      // Update local state if needed (you might need to implement this in the parent component)
      if (typeof profileData.onProfileUpdate === 'function') {
        profileData.onProfileUpdate({ ...profileData, profilePhotoURL: downloadURL });
      }

      setSuccess('Profile picture updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to update profile picture. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!updatedProfile.displayName || !updatedProfile.username) {
      setError('Name and username are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: updatedProfile.displayName,
        username: updatedProfile.username,
      });

      setSuccess('Profile updated successfully');
      setEditingProfile(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password should be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, passwordData.newPassword);

      setSuccess('Password updated successfully');
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update password. Please check your current password.');
      console.error('Error updating password:', err);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { 
      icon: User, 
      label: 'Account Details',
      onClick: () => setEditingProfile(true)
    },
    { 
      icon: Lock, 
      label: 'Change password',
      onClick: () => setIsChangingPassword(true)
    },
    { 
      icon: Bell, 
      label: 'Notifications',
      onClick: () => {}  // Add notifications functionality
    },
    { 
      icon: Sliders, 
      label: 'Preferences',
      onClick: () => {}  // Add preferences functionality
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="fixed inset-0 z-50 min-h-screen"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className={`absolute right-0 h-full w-full max-w-md ${
            darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold">Settings</h1>
            <div className="w-12"></div>
          </div>
  
          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="px-4 py-2 mb-4 bg-red-500/10 text-red-500 text-center"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="px-4 py-2 mb-4 bg-green-500/10 text-green-500 text-center"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>
  
          {/* Profile Section */}
          <div className="flex flex-col items-center px-4 py-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-100">
                {uploadingImage ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <img
                    src={profileData?.profilePhotoURL || "/api/placeholder/80/80"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
            <h2 className="mt-4 text-2xl font-semibold">{profileData?.displayName}</h2>
            <p className="text-gray-500 dark:text-gray-400">{profileData?.email}</p>
          </div>
  
          {/* Settings List */}
          <div className="px-4 space-y-2 flex-1 overflow-y-auto">
            {!isChangingPassword && !editingProfile && (
              <>
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className={`w-full flex items-center justify-between p-4 rounded-xl ${
                      darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gray-400" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {item.label}
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
                
                {/* Theme Mode Toggle */}
                <div className={`w-full flex items-center justify-between p-4 rounded-xl`}>
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-gray-400" />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Theme mode
                    </span>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </>
            )}
  
            {/* Change Password Form */}
            {isChangingPassword && (
              <div className="space-y-4 p-4">
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full p-2 rounded-lg border dark:border-gray-700 bg-transparent"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full p-2 rounded-lg border dark:border-gray-700 bg-transparent"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full p-2 rounded-lg border dark:border-gray-700 bg-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsChangingPassword(false)}
                      className="flex-1 p-2 rounded-lg border dark:border-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={loading}
                      className="flex-1 p-2 rounded-lg bg-blue-500 text-white disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}
  
            {/* Edit Profile Form */}
            {editingProfile && (
              <div className="space-y-4 p-4">
                <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={updatedProfile.displayName}
                    onChange={(e) => setUpdatedProfile({...updatedProfile, displayName: e.target.value})}
                    className="w-full p-2 rounded-lg border dark:border-gray-700 bg-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={updatedProfile.username}
                    onChange={(e) => setUpdatedProfile({...updatedProfile, username: e.target.value})}
                    className="w-full p-2 rounded-lg border dark:border-gray-700 bg-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="flex-1 p-2 rounded-lg border dark:border-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="flex-1 p-2 rounded-lg bg-blue-500 text-white disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
            };

export default SettingsPage;