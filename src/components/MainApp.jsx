import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Image, MessageSquare, Mic, Video, Lock, Send, Heart, X, EyeOff } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import MediaCapture from './MediaCapture';
import MediaPreview from './MediaPreview';
import Navigation from './Navigation';
import Timeline from './Timeline';
import ProfilePage from './profile/ProfilePage';
import CustomDateTimeSelector from './CustomDateTimeSelector';
import ChatRoom from './ChatRoom';
import SharedCalendar from './SharedCalendar';
import SecretPostModal from './SecretPostModal';
import { auth } from '../firebase';  // Add this line with your other imports
import { useDarkMode } from '../context/DarkModeContext';


const MainApp = () => {
  const { logout } = useAuth();
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

  const handlePost = async () => {
    console.log('Post button clicked', { message, mediaPreview, scheduledDateTime, isUploading });

    if ((!message && !mediaPreview) || !scheduledDateTime || isUploading) {
      console.log('Early return conditions:', {
        noContent: !message && !mediaPreview,
        noDateTime: !scheduledDateTime,
        isUploading
      });
      return;
    }

    const now = new Date();
    now.setDate(now.getDate() + 1);
    now.setHours(0, 0, 0, 0);

    if (scheduledDateTime < now) {
      alert('Please select a future date and time');
      return;
    }

    try {
      setIsUploading(true);
      console.log('Starting upload process');

      let mediaUrl = null;

      if (mediaPreview && mediaType !== 'text') {
        console.log('Processing media', { mediaType });
        
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
        
        mediaUrl = await getDownloadURL(storageRef);
        console.log('Media uploaded successfully', { mediaUrl });
      }

      setPendingPost({
        type: mediaType,
        content: message,
        scheduledFor: scheduledDateTime.toISOString(),
        mediaUrl,
        createdAt: new Date().toISOString(),
        author: 'Partner 1',
        authorId: auth.currentUser.uid,  // Add this line
        likes: 0
      });
      
      setShowSecretModal(true);

    } catch (error) {
      console.error('Error preparing post:', error);
      alert('Failed to prepare post. Please try again.');
      setIsUploading(false);
    }
  };

  const handleSecretChoice = async (isCompletelySecret, isScheduled) => {
    try {
      const finalPost = {
        ...pendingPost,
        completelySecret: isCompletelySecret,
        isScheduled: isScheduled
      };
  
      console.log('Creating Firestore document with data:', finalPost);
  
      const docRef = await addDoc(collection(db, 'posts'), finalPost);
      console.log('Post created with ID:', docRef.id);
  
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
    <div className={`min-h-screen ${darkMode ? 'bg-dark-900' : 'bg-gradient-to-b from-blue-50 to-white'} pb-20`}>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {currentPage === 'home' ? (
          <>
            {/* Header */}
            <div className={`${darkMode ? 'bg-dark-800/80' : 'bg-white/80'} backdrop-blur-sm border-none shadow-lg rounded-lg`}>
              <div className="p-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="text-rose-500" size={24} />
                  <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>
                    Our Timeline
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <Lock className={`${darkMode ? 'text-blue-400' : 'text-blue-500'}`} size={24} />
                  <button
                    onClick={logout}
                    className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
                  >
                    Logout
                  </button>
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
                    { type: 'video', icon: Video },
                    { type: 'audio', icon: Mic }
                  ].map(({ type, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => {
                        setMediaType(type);
                        setMediaPreview(null);
                      }}
                      className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110
                        ${mediaType === type 
                          ? 'bg-blue-500 text-white shadow-lg' 
                          : 'bg-white text-gray-600 hover:bg-blue-100'}`}
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
                  className={`w-full p-4 border rounded-xl resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}                
                  />

                  {/* Date and Submit */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <CustomDateTimeSelector
                        selectedDateTime={scheduledDateTime}
                        onChange={setScheduledDateTime}
                        darkMode={darkMode} // Pass the darkMode prop to CustomDateTimeSelector
                      />
                    </div>

                    <button
                      onClick={handlePost}
                      className={`px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl 
                                transition-all duration-200 hover:transform hover:scale-105
                                ${(!message && !mediaPreview) || !scheduledDateTime || isUploading
                                  ? `${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                                  : `${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}`}`}
                      disabled={(!message && !mediaPreview) || !scheduledDateTime || isUploading}
                    >
                      <Send size={20} />
                      Schedule Post
                    </button>
                  </div>
              </div>
            </div>

{/* Timeline */}
<Timeline posts={posts} />

{/* Privacy Notice */}
<div className={`${darkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-800'} border-none shadow-md rounded-lg p-4`}>
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

{/* Secret Post Modal */}
<SecretPostModal 
isOpen={showSecretModal}
onClose={() => {
setShowSecretModal(false);
setIsUploading(false);
setPendingPost(null);
}}
onConfirm={handleSecretChoice}
/>

<Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
</div>
);
};

export default MainApp;