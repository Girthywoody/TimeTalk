import React, { useState, useEffect } from 'react';
import { Heart, Clock, Video, Image, Mic, MoreVertical, Trash, Edit, Share, Flag, Search } from 'lucide-react';
import { deleteDoc, doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CustomDateTimeSelector from './CustomDateTimeSelector';
import { useDarkMode } from '../context/DarkModeContext';


// Dropdown Menu Component
const PostMenu = ({ onEdit, onDelete, isOpen, setIsOpen, position }) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20"
      style={{ top: position.top, right: position.right }}
    >
      <div className="py-1" role="menu">
        <button
          onClick={onEdit}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
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
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Share size={16} />
          Share
        </button>
        <button
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Flag size={16} />
          Report
        </button>
      </div>
    </div>
  );
};

const isPostVisible = (scheduledFor) => {
  if (!scheduledFor) return true;
  const now = new Date();
  const scheduledDate = new Date(scheduledFor);
  return now >= scheduledDate;
};

const EditPostModal = ({ post, isOpen, onClose, onSave }) => {
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
      <div className="bg-white/95 backdrop-blur-sm w-full max-w-md rounded-2xl p-6 m-4 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Edit Post</h2>
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full p-3 border rounded-lg mb-4 h-32 resize-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
            className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(post.id, editedContent, editedDateTime)}
            className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white"
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
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Query for scheduled posts that need to be published
    const scheduledPostsQuery = query(
      collection(db, 'posts'),
      where('isScheduled', '==', true),
      where('scheduledFor', '<=', new Date().toISOString())
    );

    const unsubscribe = onSnapshot(scheduledPostsQuery, (snapshot) => {
      snapshot.docs.forEach(async (doc) => {
        // Update the post to mark it as published
        await updateDoc(doc.ref, {
          isScheduled: false,
          publishedAt: new Date().toISOString()
        });
      });
    });

    return () => unsubscribe();
  }, []);

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

  const filteredPosts = [...(posts || [])]
    .filter(post => {
      // Show all non-scheduled posts
      if (!post.isScheduled) return true;

      // Hide completely secret scheduled posts until their time
      if (post.completelySecret && post.isScheduled) {
        const scheduledTime = new Date(post.scheduledFor);
        return scheduledTime <= new Date();
      }

      // Show all subtle hint posts (they'll be rendered as placeholders if not time yet)
      return true;
    })
    .filter(post => {
      if (filter === 'unlocked') {
        return !post.isScheduled || isPostVisible(post.scheduledFor);
      }
      if (filter === 'scheduled') {
        return post.isScheduled && !isPostVisible(post.scheduledFor);
      }
      return true;
    })
    .filter(post => {
      if (!searchTerm.trim()) return true;
      return post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const aDate = new Date(a.scheduledFor);
      const bDate = new Date(b.scheduledFor);
      return bDate - aDate; // Most recent first
    });

  const renderMedia = (post) => {
    // Previous media rendering logic remains the same
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
          <div className="bg-gray-50 p-4 rounded-xl">
            <audio src={post.mediaUrl} controls className="w-full" />
            <Mic className="text-gray-500 mt-2" size={24} />
          </div>
        );
      default:
        return null;
    }
  };

  const renderPost = (post) => {
    const isScheduledAndPending = post.isScheduled && !isPostVisible(post.scheduledFor);
    
    // Don't render completely hidden posts until their time
    if (isScheduledAndPending && post.completelySecret) {
      return null;
    }

    // Show improved placeholder for subtle hint posts
    if (isScheduledAndPending && !post.completelySecret) {
      return (
        <div className={`relative p-6 ${darkMode ? 'bg-gray-800/90' : 'bg-white/90'}`}>
          {/* Header with username and scheduled time */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className={`font-semibold text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {post.username}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={16} className={`${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {post.username} scheduled a post for {post.scheduledForFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Placeholder content */}
          <div className={`mt-4 p-4 rounded-lg border ${
            darkMode 
              ? 'bg-gray-700/50 border-gray-600' 
              : 'bg-gray-50/50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <Clock size={20} className={`${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                A surprise is waiting...
              </p>
            </div>
            
            {/* Show media type hint if present */}
            {post.type !== 'text' && (
              <div className={`flex items-center gap-2 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {post.type === 'image' && <Image size={16} />}
                {post.type === 'video' && <Video size={16} />}
                <span>Contains {post.type}</span>
              </div>
            )}
            
            {/* Animated placeholder lines */}
            <div className="mt-3 space-y-2">
              <div className={`h-2 rounded animate-pulse ${
                darkMode ? 'bg-gray-600' : 'bg-gray-200'
              } w-3/4`} />
              <div className={`h-2 rounded animate-pulse ${
                darkMode ? 'bg-gray-600' : 'bg-gray-200'
              } w-1/2`} />
            </div>
          </div>
        </div>
      );
    }

    // Regular post display remains the same...
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {post.username}
            </h3>
            <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              <Clock size={16} />
              <span>{post.scheduledForFormatted}</span>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={(e) => handleMenuClick(e, post.id)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreVertical size={20} className="text-gray-500" />
            </button>
            <PostMenu
              isOpen={activeMenu === post.id}
              setIsOpen={setActiveMenu}
              position={menuPosition}
              onEdit={() => handleEdit(post)}
              onDelete={() => handleDelete(post.id)}
            />
          </div>
        </div>
        
        {post.content && (
          <p className={`leading-relaxed mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {post.content}
          </p>
        )}
        
        {post.mediaUrl && renderMedia(post)}
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Posted: {new Date(post.createdAt).toLocaleDateString()}</span>
            {post.likes > 0 && (
              <span className="flex items-center gap-1">
                <Heart size={14} className="text-rose-500" fill="currentColor" />
                {post.likes}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const emptyState = (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <Clock size={48} className="mb-4" />
      <p className="text-lg font-medium">No posts yet</p>
      <p className="text-sm">Start creating memories!</p>
    </div>
  );

  return (
    <>
      <div onClick={handleClickOutside}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex gap-2">
          {['all', 'unlocked', 'scheduled'].map(option => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-3 py-1 rounded-full text-sm capitalize ${
                filter === option
                  ? 'bg-brand-500 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search posts..."
            className={`pl-9 pr-3 py-1 rounded-full border focus:outline-none ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-400'
                : 'bg-white border-gray-200 text-gray-800 placeholder-gray-500'
            }`}
          />
        </div>
        </div>
        {(!posts || posts.length === 0) && emptyState}
        {posts && posts.length > 0 && (
          <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            emptyState
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className={`${
                  darkMode ? 'bg-dark-800/90' : 'bg-white/90'
                } backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200
                border-none overflow-hidden transform hover:-translate-y-1 rounded-lg`}
              >
                {renderPost(post)}
              </div>
            ))
          )}
          </div>
        )}
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