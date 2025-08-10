import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Image, MessageSquare, Video, Lock, Send, Heart, X, EyeOff } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import MediaCapture from './MediaCapture';
import MediaPreview from './MediaPreview';
import Navigation from './Navigation';
import Timeline from './Timeline';
import ProfilePage from './profile/ProfilePage';
import CustomDateTimeSelector from './CustomDateTimeSelector';
import ChatRoom from './ChatRoom';
import SharedCalendar from './SharedCalendar';
import SecretPostModal from './SecretPostModal';
import { auth } from '../firebase';
import { useDarkMode } from '../context/DarkModeContext';
import PostButton from './PostButton';
import { sendNotification } from '../utils/Notifications';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';


const MainApp = () => {
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [mediaType, setMediaType] = useState('text');
  const [mediaPreview, setMediaPreview] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [posts, setPosts] = useState([]);
  const [scheduledDateTime, setScheduledDateTime] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [pendingPost, setPendingPost] = useState(null);
  const { darkMode } = useDarkMode();  // Add this line to get darkMode
  const [isScheduleMode, setIsScheduleMode] = useState(false);
  const [user, setUser] = useState(null);
  const { getPartnerProfile } = useAuth();
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith('/chat')) {
      setCurrentPage('chat');
    } else if (location.pathname.startsWith('/calendar')) {
      setCurrentPage('calendar');
    } else if (location.pathname.startsWith('/profile')) {
      setCurrentPage('profile');
    } else {
      setCurrentPage('home');
    }
  }, [location.pathname]);



  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      orderBy('scheduledFor', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledForFormatted: new Date(doc.data().scheduledFor).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      }));
      setPosts(newPosts);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        setUser(user);
        console.log('Auth state changed:', user?.uid); // Debug log
    });

    return () => unsubscribe();
  }, []);

  const handlePostClick = async (isScheduled) => {
    if (!message && !mediaPreview) return;
    
    if (isScheduled && scheduledDateTime) {
      setShowSecretModal(true); // Show secret modal for scheduling options
    } else {
      // Post immediately
      try {
        setIsUploading(true);
        // Get the user's profile data first
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();

        const postData = {
          type: mediaType,
          content: message,
          scheduledFor: new Date().toISOString(),
          mediaUrl: null,
          createdAt: new Date().toISOString(),
          username: userData?.displayName || auth.currentUser.displayName,
          userId: auth.currentUser.uid,
          likes: 0,
          isScheduled: false,
          completelySecret: false
        };
  
        if (mediaPreview && mediaType !== 'text') {
          const mediaUrl = await uploadMedia(mediaPreview, mediaType);
          postData.mediaUrl = mediaUrl;
        }

        const docRef = await addDoc(collection(db, 'posts'), postData);

        const partner = await getPartnerProfile();
        if (partner?.uid) {
          const notificationData = {
            title: `${userData?.displayName || 'Partner'} posted a memory`,
            body: postData.content ? (postData.content.length > 30 ? `${postData.content.slice(0,27)}...` : postData.content) : 'New post on the timeline',
            data: {
              type: 'post',
              postId: docRef.id,
              clickAction: '/',
              timestamp: Date.now()
            }
          };
          await sendNotification(partner.uid, notificationData);
        }

        // Reset form
        setMessage('');
        setScheduledDateTime(null);
        setMediaPreview(null);
        setMediaType('text');
        setIsUploading(false);
      } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
        setIsUploading(false);
      }
    }
  };
  
  const uploadMedia = async (mediaPreview, mediaType) => {
    const storageRef = ref(storage, `posts/${Date.now()}-${mediaType}`);
    
    if (mediaType === 'image') {
      const base64Content = mediaPreview.split(',')[1];
      await uploadString(storageRef, base64Content, 'base64');
    } else {
      const response = await fetch(mediaPreview);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      await new Promise((resolve) => {
        reader.onloadend = () => {
          const base64Content = reader.result.split(',')[1];
          resolve(uploadString(storageRef, base64Content, 'base64'));
        };
      });
    }
    
    return await getDownloadURL(storageRef);
  };

  const handlePost = async () => {
    if (!auth.currentUser) {
        alert('Please sign in to create a post');
        return;
    }

    if ((!message && !mediaPreview) || !scheduledDateTime || isUploading) return;

    try {
        setIsUploading(true);
        let mediaUrl = null;

        if (mediaPreview && mediaType !== 'text') {
            mediaUrl = await uploadMedia(mediaPreview, mediaType);
        }

        const notificationTime = new Date(scheduledDateTime);
        notificationTime.setDate(notificationTime.getDate() - 1);
        
        const newPost = {
            type: mediaType,
            content: message,
            scheduledFor: scheduledDateTime.toISOString(),
            mediaUrl,
            createdAt: new Date().toISOString(),
            userId: auth.currentUser.uid,
            username: auth.currentUser.displayName || 'Anonymous',
            likes: 0,
            isScheduled: true
        };

        setPendingPost(newPost);
        setShowSecretModal(true);
        setIsUploading(false);

    } catch (error) {
        console.error('Error preparing post:', error);
        alert('Failed to prepare post. Please try again.');
        setIsUploading(false);
    }
  };

  const handleSecretChoice = async (isCompletelySecret, isScheduled) => {
    if (!auth.currentUser) {
        console.error('No authenticated user');
        alert('Please sign in to create a post');
        return;
    }

    try {
        // Get the user's profile data first
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();
        
        const finalPost = {
            type: mediaType,
            content: message,
            scheduledFor: scheduledDateTime.toISOString(),
            mediaUrl: pendingPost?.mediaUrl || null,
            createdAt: new Date().toISOString(),
            userId: auth.currentUser.uid,
            username: userData?.displayName || auth.currentUser.displayName,
            likes: 0,
            isScheduled: true,
            completelySecret: isCompletelySecret,
            published: false
        };

        console.log('Attempting to create post:', finalPost);

        const docRef = await addDoc(collection(db, 'posts'), finalPost);
        console.log('Post created with ID:', docRef.id);

        // Reset form
        setMessage('');
        setScheduledDateTime(null);
        setMediaPreview(null);
        setMediaType('text');
        setShowSecretModal(false);
        setPendingPost(null);
        setIsUploading(false);

    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
        setIsUploading(false);
    }
  };

  const clearMediaPreview = () => {
    setMediaPreview(null);
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-transparent z-[49]" />
      
      <div className="pb-20 relative">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {currentPage === 'home' ? (
            <>
              {/* Header */}
              <div className={`${darkMode ? 'bg-dark-800/80' : 'bg-white/80'} backdrop-blur-sm border-none shadow-lg rounded-lg`}>
                <div className="p-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="text-rose-500" size={24} />
                    <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'bg-gradient-to-r from-brand-600 to-pink-600 bg-clip-text text-transparent'}`}>
                      Our Timeline
                    </h1>
                  </div>
                </div>
              </div>

              {/* Post Creation Card */}
              <div className={`relative ${darkMode ? 'bg-dark-800/90' : 'bg-white/90'} backdrop-blur-sm shadow-lg rounded-lg border-none z-10`}>
                <div className="p-6 space-y-4">
                  {/* Media Type Selection */}
                  <div className="flex gap-4 justify-center">
                    {[
                      { type: 'text', icon: MessageSquare },
                      { type: 'image', icon: Image },
                      { type: 'video', icon: Video }
                    ].map(({ type, icon: Icon }) => (
                      <button
                        key={type}
                        onClick={() => {
                          setMediaType(type);
                          setMediaPreview(null);
                        }}
                        className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110
                          ${mediaType === type
                            ? 'bg-brand-500 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-brand-100'}`}
                      >
                        <Icon size={24} />
                      </button>
                    ))}
                  </div>

                  {/* Media Capture/Preview */}
                  {mediaType !== 'text' && !mediaPreview && (
                    <MediaCapture 
                      mediaType={mediaType} 
                      onMediaCapture={setMediaPreview} 
                    />
                  )}
                  {mediaPreview && (
                    <MediaPreview 
                      mediaType={mediaType} 
                      mediaUrl={mediaPreview} 
                      onClear={clearMediaPreview} 
                    />
                  )}

                  {/* Message Input */}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share a memory or future thought..."
                    className={`w-full p-4 border rounded-xl resize-none h-32 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}
                    />

                  {/* Date and Submit */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <CustomDateTimeSelector
                        selectedDateTime={scheduledDateTime}
                        onChange={setScheduledDateTime}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!scheduledDateTime) {
                            handlePostClick(false); // Post immediately
                          } else {
                            handlePost(); // Show scheduling modal
                          }
                        }}
                        disabled={(!message && !mediaPreview) || isUploading}
                        className={`px-6 py-3 rounded-xl flex items-center gap-2 
                          transition-all duration-200 hover:transform hover:scale-105
                          ${(!message && !mediaPreview) || isUploading
                            ? `${darkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                            : scheduledDateTime
                              ? `${darkMode
                                  ? 'bg-pink-600 hover:bg-pink-700 text-white'
                                  : 'bg-gradient-to-r from-pink-500 to-brand-500 text-white'}`
                              : `${darkMode
                                  ? 'bg-brand-600 hover:bg-brand-700 text-white'
                                  : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white'}`
                          }`}
                      >
                        <Send size={20} />
                        {scheduledDateTime ? 'Schedule Post' : 'Post Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <Timeline posts={posts} />


              {/* Privacy Notice */}
              <div className={`${darkMode ? 'bg-brand-900/20 text-brand-300' : 'bg-brand-50 text-brand-800'} border-none shadow-md rounded-lg p-4`}>
                <div className="flex items-center gap-2">
                  <Lock size={16} />
                  Your private space: only visible to you and your partner
                </div>
              </div>
            </>
          ) : currentPage === 'profile' ? (
            <ProfilePage />
          ) : currentPage === 'chat' ? (
            <ChatRoom />
          ) : currentPage === 'calendar' ? (
            <SharedCalendar />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
              <div className="text-2xl font-bold text-gray-800 mb-4">
                {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
              </div>
              <p className="text-gray-600">Coming Soon</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-[env(safe-area-inset-bottom)] bg-transparent z-[49]" />

      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <SecretPostModal 
        isOpen={showSecretModal}
        onClose={() => setShowSecretModal(false)}
        onConfirm={handleSecretChoice}
        darkMode={darkMode}
      />
    </div>
  );
};

export default MainApp;
