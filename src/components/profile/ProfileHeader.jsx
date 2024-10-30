import React, { useState, useRef } from 'react';
import { Camera, X, Check, Edit2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ProfileHeader = ({ profileData, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoCropper, setShowPhotoCropper] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editedData, setEditedData] = useState(profileData);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setShowPhotoCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async () => {
    setUploading(true);
    try {
      // Here you would implement the actual cropping and upload logic
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the profile with the new photo URL
      onProfileUpdate({
        ...profileData,
        profilePhotoURL: selectedImage // In reality, this would be the uploaded image URL
      });
      
      setShowPhotoCropper(false);
      setSelectedImage(null);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await onProfileUpdate(editedData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <>
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
              onChange={handlePhotoSelect}
            />
          </div>

          {/* Profile Info */}
          <div className="text-center space-y-4 w-full max-w-md">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={editedData.displayName}
                  onChange={(e) => setEditedData({ ...editedData, displayName: e.target.value })}
                  className="text-center text-xl font-bold"
                  placeholder="Display Name"
                />
                <Input
                  value={editedData.username}
                  onChange={(e) => setEditedData({ ...editedData, username: e.target.value })}
                  className="text-center"
                  placeholder="Username"
                />
                <Textarea
                  value={editedData.bio}
                  onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                  className="text-center resize-none"
                  placeholder="Write a bio..."
                  rows={3}
                />
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                  >
                    Save Changes
                  </Button>
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

      {/* Photo Cropper Dialog */}
      <Dialog open={showPhotoCropper} onOpenChange={setShowPhotoCropper}>
        <DialogContent className="sm:max-w-lg">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Adjust Profile Photo</h3>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              {selectedImage && (
                <>
                  <img
                    src={selectedImage}
                    alt="Crop preview"
                    className="w-full h-full object-cover"
                    style={{
                      transform: `translate(${cropPosition.x}px, ${cropPosition.y}px)`
                    }}
                  />
                  {/* Overlay with grid lines */}
                  <div className="absolute inset-0 bg-black/40">
                    <div className="absolute inset-0 border-2 border-white rounded-full m-auto w-[90%] h-[90%]" />
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="border border-white/30" />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPhotoCropper(false)}
                disabled={uploading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCropComplete}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileHeader;