import React from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

const SecretPostModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const handleKeepPublic = () => {
    // Pass false for completelySecret and false for isScheduled
    onConfirm(false, false);
    onClose();
  };

  const handleCompletePrivacy = () => {
    // Pass true for completelySecret
    onConfirm(true, false);
    onClose();
  };

  const handleSubtleHint = () => {
    // Pass false for completelySecret and true for isScheduled
    onConfirm(false, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm w-full max-w-md rounded-2xl p-6 m-4 shadow-xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xl font-semibold mb-2">
            <Lock className="text-purple-500" />
            Keep it a secret?
          </div>
          <p className="text-gray-600">
            Choose how you want your post to appear on the timeline:
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-purple-100 bg-purple-50">
            <EyeOff className="text-purple-500 mt-1" />
            <div>
              <h4 className="font-medium text-purple-700">Complete Privacy</h4>
              <p className="text-sm text-purple-600">Post will be hidden from the timeline entirely</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50">
            <Eye className="text-blue-500 mt-1" />
            <div>
              <h4 className="font-medium text-blue-700">Subtle Hint</h4>
              <p className="text-sm text-blue-600">Show as a mysterious scheduled post</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleKeepPublic}
            className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Keep Public
          </button>
          <button
            onClick={handleCompletePrivacy}
            className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors"
          >
            Complete Privacy
          </button>
          <button
            onClick={handleSubtleHint}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            Subtle Hint
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecretPostModal;