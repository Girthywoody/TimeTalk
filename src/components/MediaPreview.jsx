import React from 'react';
import { X } from 'lucide-react';

export default function MediaPreview({ mediaType, mediaUrl, onClear }) {
  return (
    <div className="relative mt-4 rounded-xl overflow-hidden bg-gray-900">
      {mediaType === 'video' && (
        <video src={mediaUrl} controls className="w-full aspect-square object-cover" />
      )}
      {mediaType === 'image' && (
        <img src={mediaUrl} alt="Preview" className="w-full aspect-square object-cover" />
      )}
      <button
        onClick={onClear}
        className="absolute top-2 right-2 bg-white/80 p-2 rounded-full hover:bg-white transition-all duration-200"
      >
        <X size={20} />
      </button>
    </div>
  );
}