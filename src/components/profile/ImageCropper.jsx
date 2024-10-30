import React, { useState } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropper({ image, onComplete, onCancel }) {
  const [crop, setCrop] = useState();
  const [imageRef, setImageRef] = useState();
  const [loading, setLoading] = useState(false);

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
    setImageRef(e.currentTarget);
  }

  async function handleComplete() {
    if (!crop || !imageRef) return;

    setLoading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scaleX = imageRef.naturalWidth / imageRef.width;
      const scaleY = imageRef.naturalHeight / imageRef.height;

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.drawImage(
        imageRef,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 1);
      });

      onComplete(blob);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  }

  return (
    <Dialog as={motion.div} open={true} onClose={onCancel} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <Dialog.Overlay 
          as={motion.div} 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 bg-black/40" 
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
        >
          <Dialog.Title className="text-lg font-semibold mb-4">
            Adjust Profile Photo
          </Dialog.Title>

          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
            <ReactCrop
              crop={crop}
              onChange={setCrop}
              circularCrop
              aspect={1}
              className="max-h-[500px]"
            >
              <img
                src={image}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-h-[500px] w-full object-contain"
              />
            </ReactCrop>
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/30" />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Save
            </button>
          </div>
        </motion.div>
      </div>
    </Dialog>
  );
}