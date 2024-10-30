import React, { useEffect, useRef } from 'react';
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
  currentReaction // Add this prop
}) => {
  const menuRef = useRef(null);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div 
        ref={menuRef}
        className="fixed bg-white rounded-xl shadow-xl p-2 flex flex-col gap-1 min-w-[200px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Reactions */}
        <div className="flex justify-around p-2 border-b">
          {REACTIONS.map(reaction => (
            <button
              key={reaction}
              onClick={() => {
                onReact(reaction);
                onClose(); // Close menu after selecting reaction
              }}
              className={`text-xl hover:scale-125 transition-transform p-1 rounded-lg
                ${reaction === currentReaction ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : ''}
              `}
            >
              {reaction}
            </button>
          ))}
        </div>

        {/* Save Message Action */}
        <button
          onClick={() => {
            onSave();
            onClose(); // Close menu after action
          }}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          {isSaved ? (
            <>
              <BookmarkX size={18} />
              Unsave Message
            </>
          ) : (
            <>
              <Bookmark size={18} />
              Save Message
            </>
          )}
        </button>

        {/* Edit and Delete (only for own messages) */}
        {isOwnMessage && (
          <>
            <button
              onClick={() => {
                onEdit();
                onClose(); // Close menu after action
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Pencil size={18} />
              Edit Message
            </button>
            <button
              onClick={() => {
                onDelete();
                onClose(); // Close menu after action
              }}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={18} />
              Delete Message
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageActions;