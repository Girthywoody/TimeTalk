import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

const EditableBio = ({ initialBio, onBioUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(initialBio || '');
  const [tempBio, setTempBio] = useState(initialBio || '');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleEdit = () => {
    setTempBio(bio);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempBio(bio);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        bio: tempBio
      });
      
      setBio(tempBio);
      onBioUpdate(tempBio);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating bio:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto mt-2">
      {!isEditing ? (
        <div className="group relative">
          <p className="text-gray-600 min-h-[24px] text-center">
            {bio || 'Add a bio to tell your story...'}
          </p>
          <button
            onClick={handleEdit}
            className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-100"
          >
            <Pencil size={16} className="text-gray-500" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={tempBio}
            onChange={(e) => setTempBio(e.target.value)}
            placeholder="Tell your story..."
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
            rows={3}
            maxLength={200}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {tempBio.length}/200 characters
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                disabled={loading}
              >
                <X size={16} className="inline mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center"
                disabled={loading}
              >
                <Check size={16} className="mr-1" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableBio;