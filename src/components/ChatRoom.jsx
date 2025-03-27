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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useDarkMode } from '../context/DarkModeContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { db, storage } from '../firebase';
import { requestNotificationPermission, auth } from '../firebase';

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
  LogOut,
  Vibrate,
  BellRing
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';


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

const formatLastSeen = (date) => {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // difference in seconds

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

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
  const [isVisible, setIsVisible] = useState(false);
  const { user, getPartnerProfile } = useAuth();
  const { darkMode } = useDarkMode();
  const [notificationSettings, setNotificationSettings] = useState({
    muted: false,
    mutedUntil: null
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [otherUserStatus, setOtherUserStatus] = useState(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [messageStatuses, setMessageStatuses] = useState({});
  const [pressTimer, setPressTimer] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [partner, setPartner] = useState(null);
  const navigate = useNavigate();

  const otherUserInfo = {
    name: "Test", // Replace with the actual name
    photoURL: "https://path-to-photo.jpg" // Replace with actual photo URL or null
  };

  

  const searchHighlightStyles = `
  .search-highlight {git add .
git commit -m "Simplify auth flow"
git push origin main



    background-color: #FFE082 !important;
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.4) !important;
    transform: scale(1.02);
    z-index: 1;
    transition: all 0.5s ease-out !important;
  }
  .dark .search-highlight {
    background-color: #FFA000 !important;
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.5) !important;
    transition: all 0.5s ease-out !important;
  }
  .search-highlight-dark {
    background-color: #4CAF50 !important;
    box-shadow: 0 0 12px rgba(76, 175, 80, 0.4) !important;
    transform: scale(1.02);
    z-index: 1;
    transition: all 0.5s ease-out !important;
  }
  .dark .search-highlight-dark {
    background-color: #2E7D32 !important;
    box-shadow: 0 0 12px rgba(76, 175, 80, 0.5) !important;
    transition: all 0.5s ease-out !important;
  }
`;

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

  const testNotification = async () => {
    try {
        // Verify permission first
        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Notification permission denied');
            }
        }

        // Get FCM token
        const token = await requestNotificationPermission();
        if (!token) {
            throw new Error('Failed to get notification token');
        }

        console.log('Sending test notification with token:', token);

        // Send test notification
        const idToken = await auth.currentUser.getIdToken(true);
        const response = await fetch('https://us-central1-timetalk-13a75.cloudfunctions.net/api/sendNotification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                userId: auth.currentUser.uid,
                notification: {
                    title: 'Test Notification',
                    body: 'This is a test notification from TimeTalk',
                    sound: 'default',
                    priority: 'high',
                    vibrate: [200, 100, 200],
                    data: {
                        type: 'test',
                        timestamp: Date.now().toString(),
                        url: '/',
                        clickAction: '/'
                    }
                }
            })
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to send notification');
        }

        console.log('Test notification sent successfully');
        alert('Test notification sent. You should receive it shortly.');
    } catch (error) {
        console.error('Test notification failed:', error);
        alert('Failed to send test notification: ' + error.message);
    }
};

  useEffect(() => {
    // Add styles to head
    const styleSheet = document.createElement("style");
    styleSheet.innerText = searchHighlightStyles;
    document.head.appendChild(styleSheet);
  
    // Cleanup on unmount
    return () => {
      styleSheet.remove();
    };
  }, []);

  const scrollToNewestMessage = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  };

  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add temporary highlight effect
      element.classList.add('bg-yellow-100', 'dark:bg-yellow-900/20');
      setTimeout(() => {
        element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/20');
      }, 2000);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsVisible(true);
        // Add a small delay to ensure content is rendered
        setTimeout(scrollToNewestMessage, 100);
      }
    };

    // Call immediately on mount
    setIsVisible(true);
    setTimeout(scrollToNewestMessage, 100);

    // Listen for visibility changes (when user switches tabs or windows)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
        saved: false,
        status: 'sent'
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

  const handleMessageLongPress = (message, event, index, totalMessages) => {
    event.preventDefault();
    const messageElement = event.target.closest('.message-bubble');
    if (messageElement) {
      setActionPosition(getActionPosition(messageElement, window.innerHeight, index, totalMessages));
    }
    setSelectedMessage(message);
  };

// Scroll to the newest message after loading completes
useEffect(() => {
  if (!loading && messages.length > 0 && isVisible) {
    scrollToNewestMessage();
  }
}, [loading, messages, isVisible]);



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
          // Add scroll after profile loads
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
  
    fetchUserProfile();
  }, [user]);

  const handleSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      // Remove highlight class from all messages
      document.querySelectorAll('.message-bubble').forEach(element => {
        element.classList.remove('search-highlight', 'search-highlight-dark');
      });
      return;
    }
  
    const searchTerm = query.toLowerCase();
    const results = messages.filter(message => {
      if (!message.text) return false;
      return (
        message.text.toLowerCase().includes(searchTerm) ||
        message.senderProfile?.username?.toLowerCase().includes(searchTerm)
      );
    }).slice(0, 15);
    
    setSearchResults(results);
  
    // First remove highlight from all messages
    document.querySelectorAll('.message-bubble').forEach(element => {
      element.classList.remove('search-highlight', 'search-highlight-dark');
    });
  
    // Then add highlight to matching messages with auto-unhighlight
    results.forEach(message => {
      const element = document.getElementById(`message-${message.id}`);
      if (element) {
        const messageBubble = element.querySelector('.message-bubble');
        if (messageBubble) {
          if (messageBubble.classList.contains('bg-[#4E82EA]')) {
            messageBubble.classList.add('search-highlight-dark');
          } else {
            messageBubble.classList.add('search-highlight');
          }
          
          // Auto-unhighlight after 3 seconds (you can adjust this time)
          setTimeout(() => {
            messageBubble.classList.remove('search-highlight', 'search-highlight-dark');
          }, 3000); // 3000ms = 3 seconds
        }
      }
    });
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

  useEffect(() => {
    if (!user) return;

    // Get messages to find the other user's ID
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const message = snapshot.docs[0].data();
        // Get the ID of the other user (either sender or receiver)
        const otherUserId = message.senderId === user.uid 
          ? message.receiverId  // If you have this field
          : message.senderId;   // If current user is receiver

        // Get and listen to the other user's document
        const otherUserRef = doc(db, 'users', otherUserId);
        const unsubscribeUser = onSnapshot(otherUserRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setOtherUser(userData);
            
            // Check online status
            if (userData.lastActive) {
              const lastActive = userData.lastActive.toDate();
              const now = new Date();
              const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
              
              if (diffInMinutes < 2) {
                setOtherUserStatus({ isOnline: true });
              } else {
                setOtherUserStatus({
                  isOnline: false,
                  lastSeen: lastActive
                });
              }
            }
          }
        });

        return () => unsubscribeUser();
      }
    });

    // Update current user's lastActive status
    const updateUserStatus = async () => {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastActive: serverTimestamp()
      });
    };

    // Update status immediately and then every minute
    updateUserStatus();
    const intervalId = setInterval(updateUserStatus, 60000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
      updateUserStatus();
    };
  }, [user]);

  // Helper function to format last seen time
  const formatLastSeen = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Last seen ${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) { // less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `Last seen ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return `Last seen ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      })}`;
    }
  };

  const handleDoubleTap = async (message) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms
    
    if (now - lastTapTime < DOUBLE_TAP_DELAY) {
      // Double tap detected, add heart reaction
      await handleReaction(message.id, '❤️');
    }
    
    setLastTapTime(now);
  };

  const handleTouchStart = (e, message) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      time: Date.now()
    });
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    setTouchEnd({
      x: e.targetTouches[0].clientX
    });
  };

  const handleTouchEnd = (message) => {
    if (!touchStart || !touchEnd) return;
    
    const swipeDistance = touchEnd.x - touchStart.x;
    const swipeTime = Date.now() - touchStart.time;
    
    // If swipe is fast enough and long enough
    if (Math.abs(swipeDistance) > 100 && swipeTime < 300) {
      setReplyingTo(message);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    if (!user || !messages.length) return;

    // Mark all unread messages as read when recipient opens the chat
    const markMessagesAsRead = async () => {
      const unreadMessages = messages.filter(msg => 
        msg.senderId !== user.uid && 
        (!msg.status || msg.status !== 'read')
      );

      for (const message of unreadMessages) {
        const messageRef = doc(db, 'messages', message.id);
        await updateDoc(messageRef, {
          status: 'read'
        });
      }
    };

    // Mark messages as read when chat is opened
    markMessagesAsRead();

    // Mark new messages as delivered
    const userMessages = messages.filter(msg => msg.senderId === user.uid);
    userMessages.forEach(async (message) => {
      if (!message.status || message.status === 'sent') {
        const messageRef = doc(db, 'messages', message.id);
        await updateDoc(messageRef, {
          status: 'delivered'
        });
      }
    });

  }, [messages, user]);

  const MessageStatus = ({ status, isLastMessage }) => {
    if (!status || !isLastMessage) return null;

    return (
      <div className={`text-[11px] ${
        darkMode 
          ? 'text-white/80' 
          : 'text-white'
      }`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  useEffect(() => {
    if (!user) return;

    const typingRef = doc(db, 'typing', user.uid);
    
    return onSnapshot(doc(db, 'typing', otherUser?.uid || 'placeholder'), (doc) => {
      if (doc.exists()) {
        const { timestamp } = doc.data();
        if (timestamp) {
          const lastTyped = timestamp.toDate();
          const now = new Date();
          // Show typing indicator if last typed within 3 seconds
          setIsTyping(now - lastTyped < 3000);
        }
      } else {
        setIsTyping(false);
      }
    });
  }, [user, otherUser]);

  const updateTypingStatus = () => {
    if (!user) return;

    const typingRef = doc(db, 'typing', user.uid);
    updateDoc(typingRef, {
      timestamp: serverTimestamp()
    });

    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Set new timeout
    const timeout = setTimeout(() => {
      updateDoc(typingRef, {
        timestamp: null
      });
    }, 3000);
    
    setTypingTimeout(timeout);
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    updateTypingStatus();
  };

  const TypingIndicator = () => (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  );

  const getActionPosition = (messageElement, windowHeight, index, totalMessages) => {
    const rect = messageElement.getBoundingClientRect();
    // Check if message is one of the last two messages
    const isNearBottom = (index >= totalMessages - 2) || rect.bottom > (windowHeight * 0.75);
    
    return {
      x: rect.left,
      y: isNearBottom ? rect.top - 200 : rect.bottom + 8 // Adjust 200 based on your menu height
    };
  };


  const handleNudge = async () => {
    try {
        if (!partner || !partner.uid) {
            toast.error('Partner information not available');
            return;
        }
        
        const idToken = await user.getIdToken(true);
        const timestamp = Date.now().toString();
        
        const response = await fetch('https://us-central1-timetalk-13a75.cloudfunctions.net/api/sendNotification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                userId: partner.uid,
                notification: {
                    title: user.displayName || 'Your partner',
                    body: 'Hey! Come answer me!',
                    vibrate: [200, 100, 200],
                    sound: 'default',
                    priority: 'high',
                    data: {
                        type: 'nudge',
                        senderId: user.uid,
                        timestamp: timestamp,
                        clickAction: '/'
                    }
                }
            })
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to send nudge');
        }

        toast.success('Nudge sent!');
    } catch (error) {
        console.error('Error sending nudge:', error);
        toast.error('Failed to send nudge');
    }
};

  useEffect(() => {
    const handleResize = () => {
      // Check if the viewport height has decreased significantly (keyboard is shown)
      const isKeyboard = window.innerHeight < window.outerHeight * 0.75;
      setIsKeyboardVisible(isKeyboard);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchAndTrackPartner = async () => {
      try {
        // Get partner's profile
        const partnerData = await getPartnerProfile();
        if (partnerData) {
          setPartner(partnerData);
          
          // Set up real-time listener for partner's status
          const partnerRef = doc(db, 'users', partnerData.uid);
          const unsubscribe = onSnapshot(partnerRef, (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              if (data.lastActive) {
                const lastActive = data.lastActive.toDate();
                const now = new Date();
                const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
                
                setOtherUserStatus({
                  isOnline: diffInMinutes < 2,
                  lastSeen: lastActive
                });
              }
            }
          });

          // Update current user's status
          const updateStatus = async () => {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              lastActive: serverTimestamp()
            });
          };

          // Update status immediately and then every minute
          updateStatus();
          const intervalId = setInterval(updateStatus, 60000);

          return () => {
            unsubscribe();
            clearInterval(intervalId);
            // Set offline status when component unmounts
            updateDoc(doc(db, 'users', user.uid), {
              lastActive: serverTimestamp()
            });
          };
        }
      } catch (error) {
        console.error('Error setting up partner tracking:', error);
      }
    };

    fetchAndTrackPartner();
  }, [user]);

  useEffect(() => {
    const promptNotifications = async () => {
        if (Notification.permission === 'default') {
            const shouldPrompt = window.confirm(
                'Would you like to receive notifications for new messages?'
            );
            if (shouldPrompt) {
                try {
                    await Notification.requestPermission();
                } catch (error) {
                    console.error('Error requesting permission:', error);
                }
            }
        }
    };

    promptNotifications();
  }, []);

  return (
    <div className={`fixed inset-0 flex flex-col ${darkMode ? 'dark' : ''}`}>
      <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F8F9FE]'}`}>
        {/* Header */}
        <div className={`px-4 py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border-b z-10 relative`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={testNotification}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Test Notification"
              >
                <Bell size={20} className="text-blue-500" />
              </button>
              <button
                onClick={() => navigate(`/profile/${partner?.uid}`)}
                className="hover:opacity-80 transition-opacity"
              >
                {partner?.profilePhotoURL ? (
                  <img 
                    src={partner.profilePhotoURL} 
                    alt={partner.displayName || 'Partner'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-500 font-medium">
                      {partner?.displayName?.[0] || partner?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </button>
              <button
                onClick={() => navigate(`/profile/${partner?.uid}`)}
                className="text-left hover:opacity-80 transition-opacity"
              >
                <h1 className={`${darkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>
                  {partner?.displayName || partner?.email?.split('@')[0]}
                </h1>
                <p className={`text-sm ${otherUserStatus?.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
                  {isTyping ? 'typing...' : 
                    otherUserStatus?.isOnline ? 'Online' : 
                    otherUserStatus?.lastSeen ? formatLastSeen(otherUserStatus.lastSeen) : 'Offline'}
                </p>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNudge}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Nudge Partner"
              >
                <Vibrate size={20} className="text-gray-500" />
              </button>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <Search size={20} className="text-gray-500" />
              </button>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <MoreVertical size={20} className="text-gray-500" />
              </button>
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value); // Call search immediately on input
                  }}
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
              
              {/* Search Results Dropdown */}
              {searchQuery && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-96 overflow-auto border dark:border-gray-700">
                  {searchResults.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => {
                        const element = document.getElementById(`message-${message.id}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          // Add a brief scaling animation to draw attention
                          const messageBubble = element.querySelector('.message-bubble');
                          if (messageBubble) {
                            messageBubble.style.transition = 'transform 0.3s ease';
                            messageBubble.style.transform = 'scale(1.05)';
                            setTimeout(() => {
                              messageBubble.style.transform = 'scale(1.01)';
                            }, 300);
                          }
                        }
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col border-b dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {message.senderProfile?.profilePhotoURL ? (
                          <img 
                            src={message.senderProfile.profilePhotoURL} 
                            alt="Profile"
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-500 text-xs">
                              {message.senderProfile?.username?.[0] || '?'}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {message.senderProfile?.username || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {message.timestamp?.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {message.text}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden relative">
          <div 
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-y-auto px-4 z-0"
            style={{
              paddingBottom: '140px', // Increased to account for input + nav height
              paddingTop: '16px',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth'
            }}
            onLoad={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
              }
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
                      onContextMenu={(e) => handleMessageLongPress(message, e, index, messages.length)}
                      onTouchStart={(e) => {
                        setPressTimer(
                          setTimeout(() => {
                            handleMessageLongPress(message, e, index, messages.length);
                          }, 500)
                        );
                        setPressedMessageId(message.id);
                      }}
                      onTouchEnd={() => {
                        if (pressTimer) {
                          clearTimeout(pressTimer);
                          setPressTimer(null);
                        }
                        setPressedMessageId(null);
                      }}
                      onTouchMove={() => {
                        if (pressTimer) {
                          clearTimeout(pressTimer);
                          setPressTimer(null);
                        }
                        setPressedMessageId(null);
                      }}
                    >
                      {message.replyTo && (
                        <div className={`text-sm mb-1 pb-1 border-b ${
                          message.senderId === user?.uid 
                            ? "border-white/20 text-white/80" 
                            : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                        }`}>
                          <div className="flex items-center gap-1">
                            <MessageSquare size={12} />
                            <span className="font-medium">
                              {message.replyTo.senderId === user?.uid ? 'You' : 'Their message'}
                            </span>
                          </div>
                          <div className="line-clamp-1">{message.replyTo.text}</div>
                        </div>
                      )}

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

                      <div className="flex items-center justify-between gap-2">
                        <div className={`text-[11px] ${
                          darkMode 
                            ? 'text-white/80' 
                            : message.senderId === user?.uid 
                              ? 'text-white' 
                              : 'text-gray-500'
                        }`}>
                          {message.timestamp?.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        
                        {message.senderId === user?.uid && (
                          <MessageStatus 
                            status={message.status} 
                            isLastMessage={index === messages.length - 1}
                          />
                        )}
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
        <div className={`fixed ${
          isKeyboardVisible ? 'bottom-0' : 'bottom-[80px]'
        } left-0 right-0 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        } border-t z-20 transition-all duration-300`}>
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
                    onChange={handleInputChange}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Message"
                    className={`flex-1 bg-transparent border-none py-2 ${
                      darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'
                    } focus:outline-none`}
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