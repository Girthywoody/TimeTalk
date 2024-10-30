import React, { useState, useRef, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  where,
  Timestamp
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import MessageActions from './MessageActions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { 
  Send, 
  Loader2, 
  X, 
  Paperclip, 
  Search,
  MoreVertical,
  Download,
  Bookmark,
  Maximize2,
  UserPlus,
  Share2,
  Archive,
  MessageSquare,
  BookmarkCheck,
  Trash2,
  AlertCircle,
  Settings,
  Bell,
  BellOff,
  Moon,
  LogOut
} from 'lucide-react';

const MESSAGES_LIMIT = 100;
const MESSAGE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [chatProfiles, setChatProfiles] = useState({});
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionPosition, setActionPosition] = useState({ x: 0, y: 0 });
  const [editingMessage, setEditingMessage] = useState(null);
  const [pressedMessageId, setPressedMessageId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const sendSound = useRef(new Audio('/sounds/swoosh.mp3'));
  const receiveSound = useRef(new Audio('/sounds/ding.mp3'));
  const { user } = useAuth();

  const [notificationSettings, setNotificationSettings] = useState({
    muted: false,
    mutedUntil: null
  });
  const [darkMode, setDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (!searchQuery) {
      const messageElements = document.querySelectorAll('.message-text');
      messageElements.forEach(element => {
        element.innerHTML = element.textContent || '';
      });
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
        if (isNearBottom) {
          setTimeout(() => {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: 'smooth'
            });
          }, 100);
        }
      }
    }
  }, [loading, messages]);

  const handleMuteNotifications = (duration) => {
    const now = new Date();
    let mutedUntil = null;
    
    switch (duration) {
      case '1h':
        mutedUntil = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case '8h':
        mutedUntil = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        break;
      case '24h':
        mutedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'forever':
        mutedUntil = 'forever';
        break;
      default:
        mutedUntil = null;
    }

    setNotificationSettings({
      muted: !!mutedUntil,
      mutedUntil
    });
    setIsDropdownOpen(false);
  };

  const scrollToNewestMessage = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const inputHeight = 80; // Approximate height of input area
      container.scrollTop = container.scrollHeight - container.clientHeight + inputHeight;
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('Unsupported file type. Please upload an image, PDF, or Word document.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert('File is too large. Maximum size is 5MB.');
      return;
    }

    try {
      setSelectedFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, just show the file name
        setSelectedFilePreview(null);
      }
    } catch (error) {
      console.error('Error handling file:', error);
      alert('Error handling file. Please try again.');
      removeSelectedFile();
    }
  };

  const uploadFile = async (file) => {
    if (!file || !user) throw new Error('No file or user');
  
    try {
      // Create a reference with the correct path matching the storage rules
      const storageRef = ref(storage, `chat-files/${user.uid}/${Date.now()}-${file.name}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setSelectedFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || !user || !userProfile) return;

    try {
      setUploading(true);
      let fileURL = null;
      let fileType = null;
      
      if (selectedFile) {
        try {
          fileURL = await uploadFile(selectedFile);
          fileType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
        } catch (error) {
          console.error('Error uploading file:', error);
          alert('Failed to upload file. Please try again.');
          setUploading(false);
          return;
        }
      }

      const messagesRef = collection(db, 'messages');
      const messageData = {
        text: newMessage.trim() || null,
        senderId: user.uid,
        timestamp: serverTimestamp(),
        edited: false,
        deleted: false,
        saved: false
      };

      if (fileURL) {
        messageData.type = newMessage.trim() ? 'mixed' : fileType;
        messageData.fileURL = fileURL;
        messageData.fileName = selectedFile.name;
        messageData.fileType = selectedFile.type;
      } else {
        messageData.type = 'text';
      }

      const docRef = await addDoc(messagesRef, messageData);
      setLastMessageId(docRef.id);
      
      try {
        await sendSound.current.play();
      } catch (err) {
        console.log('Audio play failed:', err);
      }
      
      setNewMessage('');
      removeSelectedFile();
    } catch (error) {
      console.error("Error sending message:", error);
      alert('Failed to send message. Please try again.');
    } finally {
      setUploading(false);
    }
  };


  const handleEditMessage = async (messageId, newText) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        text: newText,
        edited: true,
        editedAt: serverTimestamp()
      });
      setEditingMessage(null);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      });
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReaction = async (messageId, reaction) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const currentReaction = messageDoc.data().reaction;
        
        if (currentReaction?.userId === user.uid && currentReaction?.emoji === reaction) {
          await updateDoc(messageRef, {
            reaction: null
          });
        } else {
          await updateDoc(messageRef, {
            reaction: {
              emoji: reaction,
              userId: user.uid,
              timestamp: serverTimestamp()
            }
          });
        }
      }
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const handleSaveMessage = async (messageId) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const currentSavedState = messageDoc.data().saved;
        await updateDoc(messageRef, {
          saved: !currentSavedState
        });
      }
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error toggling save state:', error);
    }
  };

  const handleMessageLongPress = (message, event) => {
    event.preventDefault();
    const messageElement = event.target.closest('.message-bubble');
    if (messageElement) {
      const rect = messageElement.getBoundingClientRect();
      setActionPosition({
        x: rect.left,
        y: rect.bottom + 8
      });
    }
    setSelectedMessage(message);
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [user]);

// Replace your existing useEffect for scrolling
useEffect(() => {
  if (!loading && messages.length > 0) {
    scrollToNewestMessage();
  }
}, [loading, messages]);



const handleSearch = () => {
  const searchTerm = searchQuery.toLowerCase();
  const results = messages.filter(message => {
    if (!message.text) return false;
    return message.text.toLowerCase().includes(searchTerm);
  });
  
  setSearchResults(results);

  // Only highlight if there's a search term
  if (searchTerm) {
    const messageElements = document.querySelectorAll('.message-text');
    messageElements.forEach(element => {
      if (!element.textContent) return;
      
      const text = element.textContent;
      const isSenderMessage = element.closest('.message-bubble').classList.contains('bg-[#4E82EA]');
      
      // Create a temporary div to safely handle HTML content
      const tempDiv = document.createElement('div');
      tempDiv.textContent = text;
      const safeText = tempDiv.innerHTML;
      
      // Use capture groups to preserve case when highlighting
      const regex = new RegExp(`(${searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
      const highlightClass = isSenderMessage
        ? 'bg-white/30 rounded px-1' // For sender's messages (blue bubbles)
        : 'bg-blue-100 dark:bg-blue-900 rounded px-1'; // For received messages
      
      element.innerHTML = safeText.replace(regex, `<span class="${highlightClass}">$1</span>`);
    });
  } else {
    // Reset highlights when search is cleared
    const messageElements = document.querySelectorAll('.message-text');
    messageElements.forEach(element => {
      if (element.textContent) {
        element.innerHTML = element.textContent;
      }
    });
  }
};

  useEffect(() => {
    if (!user) return;

    const messagesRef = collection(db, 'messages');
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - MESSAGE_EXPIRATION_TIME);

    const q = query(
      messagesRef,
      where('timestamp', '>', Timestamp.fromDate(twentyFourHoursAgo)),
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_LIMIT)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const newMessages = [];
      const uniqueUserIds = new Set();

      snapshot.docChanges().forEach((change) => {
        if (
          change.type === 'added' && 
          change.doc.data().senderId !== user.uid &&
          change.doc.id !== lastMessageId
        ) {
          receiveSound.current.play().catch(err => console.log('Audio play failed:', err));
        }
      });

      snapshot.forEach(doc => {
        const data = doc.data();
        const messageTimestamp = data.timestamp?.toDate();
        
        if (data.saved || (messageTimestamp && (now - messageTimestamp) < MESSAGE_EXPIRATION_TIME)) {
          uniqueUserIds.add(data.senderId);
          newMessages.push({
            id: doc.id,
            ...data,
            timestamp: messageTimestamp
          });
        }
      });

      const newProfiles = { ...chatProfiles };
      for (const userId of uniqueUserIds) {
        if (!newProfiles[userId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              newProfiles[userId] = userDoc.data();
            }
          } catch (error) {
            console.error(`Error fetching profile for user ${userId}:`, error);
          }
        }
      }

      if (Object.keys(newProfiles).length > Object.keys(chatProfiles).length) {
        setChatProfiles(newProfiles);
      }

      const messagesWithProfiles = newMessages.map(msg => ({
        ...msg,
        senderProfile: newProfiles[msg.senderId]
      }));

      setMessages(messagesWithProfiles.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, lastMessageId]);

  return (
    <div className={`fixed inset-0 flex flex-col ${darkMode ? 'dark' : ''}`}>
      <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F8F9FE]'}`}>
        {/* Header */}
        <div className={`px-4 py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border-b`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {userProfile?.profilePhotoURL ? (
                <img 
                  src={userProfile.profilePhotoURL} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-500 font-medium">
                    {userProfile?.username?.[0] || userProfile?.displayName?.[0] || '?'}
                  </span>
                </div>
              )}
              <div>
              <h1 className={`${darkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>
                  {userProfile?.username || userProfile?.displayName}
                </h1>
                <p className="text-sm text-green-500">Online</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Search Messages"
              >
                <Search size={20} className="text-blue-500" />
              </button>
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title="More Options"
                >
                  <MoreVertical size={20} className="text-blue-500" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 divide-y divide-gray-100 dark:divide-gray-700">
                    {/* Notification Settings */}
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                        Notifications
                      </div>
                      {notificationSettings.muted ? (
                        <button
                          onClick={() => handleMuteNotifications(null)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Bell className="mr-2 h-4 w-4" />
                          <span>Unmute Notifications</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleMuteNotifications('1h')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <BellOff className="mr-2 h-4 w-4" />
                            <span>Mute for 1 hour</span>
                          </button>
                          <button
                            onClick={() => handleMuteNotifications('8h')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <BellOff className="mr-2 h-4 w-4" />
                            <span>Mute for 8 hours</span>
                          </button>
                          <button
                            onClick={() => handleMuteNotifications('24h')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <BellOff className="mr-2 h-4 w-4" />
                            <span>Mute for 24 hours</span>
                          </button>
                          <button
                            onClick={() => handleMuteNotifications('forever')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <BellOff className="mr-2 h-4 w-4" />
                            <span>Mute indefinitely</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Display Settings */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setDarkMode(!darkMode);
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Moon className="mr-2 h-4 w-4" />
                        <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Chat Settings</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search bar */}
          {isSearchOpen && (
            <div className="mt-2 relative">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => {
                        scrollToMessage(message.id);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {message.text?.substring(0, 100)}
                        {message.text?.length > 100 ? '...' : ''}
                      </span>
                      <span className="text-xs text-gray-400">
                        {message.timestamp?.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden">
          <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto px-4"
            style={{
              scrollBehavior: 'smooth',
              overscrollBehavior: 'contain',
              height: 'calc(100vh - 240px)', // Adjusted to account for header and input
              paddingBottom: '24px'
            }}
          >
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    id={`message-${message.id}`}
                    key={message.id}
                    className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"} mb-2`}
                  >
                    {message.senderId !== user?.uid && (
                      <div className="w-8 h-8 rounded-full mr-2 overflow-hidden flex-shrink-0">
                        {message.senderProfile?.profilePhotoURL ? (
                          <img 
                            src={message.senderProfile.profilePhotoURL} 
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-500 text-sm font-medium">
                              {message.senderProfile?.username?.[0] || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      className={`message-bubble relative max-w-[75%] rounded-2xl px-4 py-2 
                        ${message.senderId === user?.uid 
                          ? "bg-[#4E82EA] text-white rounded-br-none" 
                          : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none shadow-sm"}
                        ${message.saved ? "border border-yellow-400" : ""}
                        ${pressedMessageId === message.id ? 'scale-95' : 'scale-100'}
                        ${index === messages.length - 1 ? 'mb-4' : 'mb-2'}
                        transition-all duration-200`}
                      onContextMenu={(e) => handleMessageLongPress(message, e)}
                      onTouchStart={(e) => {
                        setPressedMessageId(message.id);
                        let timer = setTimeout(() => handleMessageLongPress(message, e), 500);
                        e.target.addEventListener('touchend', () => {
                          clearTimeout(timer);
                          setPressedMessageId(null);
                        }, { once: true });
                      }}
                    >
                      {message.deleted ? (
                        <div className="italic text-opacity-70">This message was deleted</div>
                      ) : (
                        <>
                          {message.reaction && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReaction(message.id, message.reaction.emoji);
                              }}
                              className={`
                                absolute -top-3 
                                ${message.senderId === user?.uid ? '-left-3' : '-right-3'}
                                bg-white dark:bg-gray-700 rounded-full shadow-md p-1 text-sm cursor-pointer
                                hover:scale-110 
                                transition-transform`}
                            >
                              {message.reaction.emoji}
                            </div>
                          )}

                          {message.type === 'text' && (
                            <div className="break-words">
                              {editingMessage?.id === message.id ? (
                                <input
                                  type="text"
                                  value={editingMessage.text}
                                  onChange={(e) => setEditingMessage({ ...editingMessage, text: e.target.value })}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleEditMessage(message.id, editingMessage.text);
                                    }
                                  }}
                                  className={`w-full bg-transparent border-b ${
                                    message.senderId === user?.uid 
                                      ? "border-white/50 text-white placeholder-white/50"
                                      : "border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400"
                                  } focus:outline-none`}
                                  autoFocus
                                />
                              ) : (
                                <span className="message-text text-[15px] leading-relaxed">{message.text}</span>
                              )}
                            </div>
                          )}

                          {(message.type === 'image' || message.type === 'mixed') && (
                            <>
                              <div className="rounded-lg overflow-hidden mt-1 relative group">
                                <img 
                                  src={message.fileURL} 
                                  alt="Shared image"
                                  className={`max-w-full rounded-lg cursor-pointer transition-all duration-200 ${
                                    imagePreview === message.fileURL ? 'w-full' : 'max-h-48 object-cover'
                                  }`}
                                  loading="lazy"
                                  onClick={() => setImagePreview(message.fileURL)}
                                />
                              </div>
                              {message.text && (
                                <div className="mt-2 text-[15px] leading-relaxed">
                                  {message.text}
                                </div>
                              )}
                            </>
                          )}

                          {message.type === 'file' && (
                            <a 
                              href={message.fileURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 text-sm hover:underline mt-1 ${
                                message.senderId === user?.uid 
                                  ? "text-white/90 hover:text-white" 
                                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                              }`}
                            >
                              <Paperclip size={16} />
                              {message.fileName}
                            </a>
                          )}

                          {message.edited && (
                            <div className={`text-xs mt-1 ${
                              message.senderId === user?.uid 
                                ? "text-white/60" 
                                : "text-gray-500 dark:text-gray-400"
                            }`}>
                              (edited)
                            </div>
                          )}

                          {message.saved && (
                            <div className="absolute -top-2 -right-2">
                              <Bookmark size={16} className="text-yellow-400 fill-yellow-400" />
                            </div>
                          )}
                        </>
                      )}

                      <div className={`text-[11px] mt-1 ${
                        message.senderId === user?.uid 
                          ? "text-white/60" 
                          : "text-gray-500 dark:text-gray-400"
                      }`}>
                        {message.timestamp?.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Message Input */}
        <div className={`sticky bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border-t`}>
         <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex flex-col gap-2">
              {selectedFilePreview && (
                <div className="relative inline-block">
                  <img 
                    src={selectedFilePreview} 
                    alt="Selected file" 
                    className="h-20 w-auto rounded-lg object-cover"
                  />
                  <button
                    onClick={removeSelectedFile}
                    className="absolute -top-2 -right-2 p-1 bg-gray-800 dark:bg-gray-600 rounded-full text-white hover:bg-gray-900 dark:hover:bg-gray-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-2">
              <div className={`flex-1 ${darkMode ? 'bg-gray-700' : 'bg-[#F8F9FE]'} rounded-full flex items-center pl-4 pr-2`}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Message"
                  className={`flex-1 bg-transparent border-none py-2 ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'} focus:outline-none`}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                  >
                    <Paperclip size={20} />
                  </button>
                </div>
                
                <button
                  onClick={handleSend}
                  disabled={(!newMessage.trim() && !selectedFile) || !userProfile || uploading}
                  className={`p-3 rounded-full flex items-center justify-center transition-all duration-200 
                    ${(newMessage.trim() || selectedFile) && userProfile && !uploading
                      ? "bg-[#4E82EA] text-white hover:bg-blue-600"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-400"}`}
                >
                  {uploading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
        />

        {/* Chat Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-96 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Chat Settings</h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message Font Size
                  </label>
                  <select className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chat Background
                  </label>
                  <select className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2">
                    <option value="default">Default</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Group Messages
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Actions Menu */}
        <MessageActions
          currentReaction={selectedMessage?.reaction?.emoji}
          isOpen={!!selectedMessage}
          onClose={() => {
            setSelectedMessage(null);
            setPressedMessageId(null);
          }}
          onEdit={() => setEditingMessage(selectedMessage)}
          onDelete={() => handleDeleteMessage(selectedMessage?.id)}
          onReact={(reaction) => handleReaction(selectedMessage?.id, reaction)}
          onSave={() => handleSaveMessage(selectedMessage?.id)}
          isSaved={selectedMessage?.saved}
          position={actionPosition}
          isOwnMessage={selectedMessage?.senderId === user?.uid}
        />

          {/* Image Preview Dialog */}
          {imagePreview && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
              style={{ paddingBottom: '80px' }}
              onClick={() => setImagePreview(null)}
            >
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <a 
                  href={imagePreview}
                  download
                  onClick={e => e.stopPropagation()}
                  className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white transition-colors"
                >
                  <Download size={24} />
                </a>
                <button 
                  onClick={() => setImagePreview(null)}
                  className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-w-[90%] max-h-[calc(100vh-160px)] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
      </div>
    </div>
  );
};

export default ChatRoom;