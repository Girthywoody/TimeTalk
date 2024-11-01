import React, { useState, useEffect } from 'react';
import { Heart, Clock, Video, Image, MessageSquare, Mic, Lock, MoreVertical, Trash, Edit, Share, Flag } from 'lucide-react';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CustomDateTimeSelector from './CustomDateTimeSelector';
import { useDarkMode } from '../context/DarkModeContext';

// PostMenu Component remains the same
const PostMenu = ({ onEdit, onDelete, isOpen, setIsOpen, position }) => {
  const { darkMode } = useDarkMode();
  
  if (!isOpen) return null;
  
  return (
    <div 
      className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } ring-1 ring-black ring-opacity-5 z-20`}
      style={{ top: position.top, right: position.right }}
    >
      <div className="py-1" role="menu">
        <button
          onClick={onEdit}
          className={`w-full px-4 py-2 text-left text-sm ${
            darkMode 
              ? 'text-gray-300 hover:bg-gray-700' 
              : 'text-gray-700 hover:bg-gray-50'
          } flex items-center gap-2`}
        >
          <Edit size={16} />
          Edit Post
        </button>
        <button
          onClick={onDelete}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
        >
          <Trash size={16} />
          Delete Post
        </button>
        <button
          className={`w-full px-4 py-2 text-left text-sm ${
            darkMode 
              ? 'text-gray-300 hover:bg-gray-700' 
              : 'text-gray-700 hover:bg-gray-50'
          } flex items-center gap-2`}
        >
          <Share size={16} />
          Share
        </button>
        <button
          className={`w-full px-4 py-2 text-left text-sm ${
            darkMode 
              ? 'text-gray-300 hover:bg-gray-700' 
              : 'text-gray-700 hover:bg-gray-50'
          } flex items-center gap-2`}
        >
          <Flag size={16} />
          Report
        </button>
      </div>
    </div>
  );
};

// EditPostModal Component
const EditPostModal = ({ post, isOpen, onClose, onSave }) => {
  const { darkMode } = useDarkMode();
  const [editedContent, setEditedContent] = useState('');
  const [editedDateTime, setEditedDateTime] = useState(null);

  useEffect(() => {
    if (post && isOpen) {
      setEditedContent(post.content || '');
      setEditedDateTime(post.scheduledFor ? new Date(post.scheduledFor) : null);
    }
  }, [post, isOpen]);

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${
        darkMode 
          ? 'bg-gray-800/95 text-white' 
          : 'bg-white/95'
        } backdrop-blur-sm w-full max-w-md rounded-2xl p-6 m-4 shadow-xl`}>
        <h2 className="text-xl font-semibold mb-4">Edit Post</h2>
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className={`w-full p-3 border rounded-lg mb-4 h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-200'
          }`}
          placeholder="Edit your message..."
        />
        <div className="mb-4">
          <CustomDateTimeSelector
            selectedDateTime={editedDateTime}
            onChange={setEditedDateTime}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg border ${
              darkMode 
                ? 'border-gray-600 hover:bg-gray-700' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(post.id, editedContent, editedDateTime)}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const Timeline = ({ posts }) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [editModal, setEditModal] = useState({ isOpen: false, post: null });
  const { darkMode } = useDarkMode();

  const handleMenuClick = (event, postId) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.height + 5,
      right: 0,
    });
    setActiveMenu(activeMenu === postId ? null : postId);
  };

  const handleClickOutside = () => {
    setActiveMenu(null);
  };

  const handleEdit = (post) => {
    setEditModal({ isOpen: true, post });
    setActiveMenu(null);
  };

  const handleDelete = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setActiveMenu(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleSaveEdit = async (postId, content, scheduledDateTime) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        content: content,
        scheduledFor: scheduledDateTime.toISOString()
      });
      setEditModal({ isOpen: false, post: null });
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  const renderMedia = (post) => {
    switch (post.type) {
      case 'video':
        return (
          <div className="relative rounded-xl overflow-hidden">
            <video 
              src={post.mediaUrl} 
              controls 
              className="w-full h-64 object-cover"
            />
            <Video className="absolute top-2 right-2 text-white/80" size={24} />
          </div>
        );
      case 'image':
        return (
          <div className="relative rounded-xl overflow-hidden">
            <img 
              src={post.mediaUrl} 
              alt={post.content} 
              className="w-full h-64 object-cover"
            />
            <Image className="absolute top-2 right-2 text-white/80" size={24} />
          </div>
        );
      case 'audio':
        return (
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-xl`}>
            <audio src={post.mediaUrl} controls className="w-full" />
            <Mic className={darkMode ? 'text-gray-300' : 'text-gray-500'} size={24} />
          </div>
        );
      default:
        return null;
    }
  };

  if (!posts || posts.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${
        darkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <Clock size={48} className="mb-4" />
        <p className="text-lg font-medium">No posts yet</p>
        <p className="text-sm">Start creating memories!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4" onClick={handleClickOutside}>
        {posts.filter(post => !post.completelySecret).map((post) => (
          <div 
            key={post.id} 
            className={`${
              darkMode 
                ? 'bg-gray-800/90' 
                : 'bg-white/90'
            } backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 
            border-none overflow-hidden transform hover:-translate-y-1 rounded-lg`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`font-semibold text-lg ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {post.author}
                  </h3>
                  <div className={`flex items-center gap-2 text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  } mt-1`}>
                    <Clock size={16} />
                    <span>Scheduled for: {post.scheduledForFormatted}</span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => handleMenuClick(e, post.id)}
                    className={`p-2 rounded-full ${
                      darkMode 
                        ? 'hover:bg-gray-700' 
                        : 'hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <MoreVertical size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </button>
                  {activeMenu === post.id && (
                    <PostMenu
                      onEdit={() => handleEdit(post)}
                      onDelete={() => handleDelete(post.id)}
                      isOpen={true}
                      setIsOpen={setActiveMenu}
                      position={menuPosition}
                    />
                  )}
                </div>
              </div>
              
              {post.content && (
                <p className={`${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                } leading-relaxed mb-4`}>
                  {post.content}
                </p>
              )}
              
              {post.mediaUrl && renderMedia(post)}
              
              <div className={`mt-4 pt-4 border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className={darkMode ? 'text-gray-400' : ''}>
                    Posted: {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  {post.likes > 0 && (
                    <span className="flex items-center gap-1">
                      <Heart size={14} className="text-rose-500" fill="currentColor" />
                      {post.likes}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <EditPostModal
        isOpen={editModal.isOpen}
        post={editModal.post}
        onClose={() => setEditModal({ isOpen: false, post: null })}
        onSave={handleSaveEdit}
      />
    </>
  );
};

export default Timeline;