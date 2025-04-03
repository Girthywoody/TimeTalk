import React, { useEffect, useRef, useState } from 'react';
import { Heart, Pencil, Trash2, X, Bookmark, BookmarkX } from 'lucide-react';

const REACTIONS = ['❤️', '😊', '👍', '😮', '😢', '😡'];

const MessageActions = ({ 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  onReact, 
  position,
  isOwnMessage,
  onSave,
  isSaved,
  currentReaction
}) => {
  const menuRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Slight delay before showing content for smoother animation
      setTimeout(() => setShowContent(true), 50);
    } else {
      setShowContent(false);
      setIsAnimating(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const menuRect = menu.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let finalX = position.x;
      let finalY = position.y;

      if (finalX + menuRect.width > windowWidth) {
        finalX = windowWidth - menuRect.width - 16;
      }
      if (finalX < 16) {
        finalX = 16;
      }

      if (finalY + menuRect.height > windowHeight) {
        finalY = finalY - menuRect.height - 16;
      }
      if (finalY < 16) {
        finalY = 16;
      }

      menu.style.left = `${finalX}px`;
      menu.style.top = `${finalY}px`;
    }
  }, [isOpen, position]);

  if (!isAnimating && !isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 transition-all duration-200 ${
        showContent ? 'bg-black/20 backdrop-blur-sm' : 'bg-transparent'
      }`} 
      onClick={onClose}
    >
      <div 
        ref={menuRef}
        className={`fixed bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-200 ${
          showContent 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 -translate-y-2'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Reactions Section */}
        <div className="p-2 border-b dark:border-gray-700">
          <div className="flex gap-1">
            {REACTIONS.map((reaction, index) => (
              <button
                key={reaction}
                onClick={() => {
                  onReact(reaction);
                  onClose();
                }}
                className={`group relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 ${
                  showContent 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                }`}
                style={{ 
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                <span className={`text-xl transition-transform duration-200 group-hover:scale-125 block ${
                  reaction === currentReaction 
                    ? 'scale-110 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800 rounded-full' 
                    : ''
                }`}>
                  {reaction}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions Section */}
        <div className={`flex flex-col transition-all duration-200 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={() => {
              onSave();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {isSaved ? (
              <>
                <BookmarkX size={18} />
                <span className="text-sm">Unsave Message</span>
              </>
            ) : (
              <>
                <Bookmark size={18} />
                <span className="text-sm">Save Message</span>
              </>
            )}
          </button>

          {isOwnMessage && (
            <>
              <button
                onClick={() => {
                  onEdit();
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Pencil size={18} />
                <span className="text-sm">Edit Message</span>
              </button>
              <button
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
              >
                <Trash2 size={18} />
                <span className="text-sm">Delete Message</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageActions;