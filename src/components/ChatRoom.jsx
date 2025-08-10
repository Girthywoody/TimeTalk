import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
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
import { requestNotificationPermission, refreshFCMToken, auth } from '../firebase';
import { sendNotification } from '../utils/Notifications';

import { useNavigate, useLocation } from 'react-router-dom';

import {
  Send,
  Loader2,
  X,
  Paperclip,
  Camera,
  Search,
  MoreVertical,
  Download,
  Bookmark,
  Maximize2,
  UserPlus,
  Share2,
  Archive,
  MessageSquare,
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
import { useInView } from 'react-intersection-observer';


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
const NAV_BAR_HEIGHT = 72;

const formatDateDivider = (date) =>
  date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

const isNewDay = (msgs, index) => {
  if (index === 0) return true;
  const current = msgs[index].timestamp instanceof Timestamp ? msgs[index].timestamp.toDate() : msgs[index].timestamp;
  const previous = msgs[index - 1].timestamp instanceof Timestamp ? msgs[index - 1].timestamp.toDate() : msgs[index - 1].timestamp;
  return current.toDateString() !== previous.toDateString();
};

const shouldShowClusterTime = (msgs, index) => {
  if (index === 0) return true;
  const current = msgs[index].timestamp instanceof Timestamp ? msgs[index].timestamp.toDate() : msgs[index].timestamp;
  const previous = msgs[index - 1].timestamp instanceof Timestamp ? msgs[index - 1].timestamp.toDate() : msgs[index - 1].timestamp;
  return previous.getTime() + 5 * 60 * 1000 < current.getTime() || msgs[index - 1].senderId !== msgs[index].senderId;
};

const formatLastSeen = (date) => {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // difference in seconds

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

const ChatRoom = ({ setHideNav, hideNav }) => {
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
  const { ref: messagesEndRef, inView } = useInView();
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputContainerRef = useRef(null);
  const [inputHeight, setInputHeight] = useState(0);
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined'
      ? window.visualViewport?.height || window.innerHeight
      : 0
  );
  const [partner, setPartner] = useState(null);
  const navigate = useNavigate();
  const [isPartnerActive, setIsPartnerActive] = useState(false);

  useEffect(() => {
    return () => {
      setHideNav && setHideNav(false);
    };
  }, [setHideNav]);


  const otherUserInfo = {
    name: "Test", // Replace with the actual name
    photoURL: "https://path-to-photo.jpg" // Replace with actual photo URL or null
  };

  
  const searchHighlightStyles = `.search-highlight {
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

const location = useLocation();
const [showNudgeAnimation, setShowNudgeAnimation] = useState(false);

useEffect(() => {
  // Check for nudge parameters
  const params = new URLSearchParams(location.search);
  if (params.get('nudged') === 'true') {
    // Show nudge animation
    setShowNudgeAnimation(true);
    
    // Clear the parameter from URL to avoid showing animation on refresh
    window.history.replaceState({}, document.title, location.pathname);
    
    // Hide animation after a few seconds
    setTimeout(() => {
      setShowNudgeAnimation(false);
    }, 3000);
  }
}, [location]);

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

  // Replace your notification status check with this more robust implementation
// This prevents errors from undefined array access and React mount issues

const checkNotificationStatus = async () => {
  // Only check if the component is still mounted and user exists
  if (!user) return;
  
  try {
    // Check if device supports notifications
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('This browser does not support notifications');
      return;
    }
    
    // Check current permission
    if (Notification.permission === 'granted') {
      try {
        // Get a fresh token to ensure FCM is working
        const token = await requestNotificationPermission();
        if (token) {
          console.log('Notification token refreshed:', token);
        } else {
          console.warn('Permission granted but token not obtained');
        }
      } catch (error) {
        console.error('Error getting notification token:', error);
      }
    } else if (Notification.permission === 'default') {
      // Only show prompt if not already asked in this session
      if (!sessionStorage.getItem('notification_asked')) {
        sessionStorage.setItem('notification_asked', 'true');
        
        toast.info(
          'Enable notifications to get message alerts?',
          {
            onClick: async () => {
              try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                  const token = await requestNotificationPermission();
                  if (token) {
                    toast.success('Notifications enabled successfully');
                  }
                }
              } catch (error) {
                console.error('Error requesting permission:', error);
              }
            },
            autoClose: 10000,
            closeButton: true
          }
        );
      }
    }
  } catch (error) {
    console.error('Notification check failed:', error);
  }
};

// Replace this useEffect block in ChatRoom.jsx (around line 144-184)
useEffect(() => {
  let mounted = true;
  
  // Only run once when component mounts
  if (user && mounted) {
    // Small timeout to ensure component is fully mounted
    const timer = setTimeout(() => {
      if (mounted) {
        checkNotificationStatus();
      }
    }, 2000);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }
  
  return () => {
    mounted = false;
  };
}, [user]); // Only depend on user
  

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
      // Show loading toast
      const loadingToastId = toast.loading('Testing notification system...');
      
      // Check if notifications are supported
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        toast.update(loadingToastId, {
          render: 'This browser does not support notifications',
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
        return;
      }
      
      // Verify permission
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.update(loadingToastId, {
            render: 'Notification permission denied',
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
          return;
        }
      }
      
      // Refresh the token to ensure it's valid
      const token = await refreshFCMToken();
      if (!token) {
        toast.update(loadingToastId, {
          render: 'Failed to get notification token',
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
        return;
      }
      
      // Send a local notification first to test browser support
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Local Test', {
        body: 'This is a local browser notification test',
        icon: '/ios-icon-192.png'
      });
      
      // Now send an FCM notification to yourself
      const testData = {
        title: "FCM Test Notification",
        body: "This is an FCM test notification",
        data: {
          type: 'test',
          timestamp: Date.now().toString(),
          clickAction: '/'
        }
      };
  
      const result = await sendNotification(user.uid, testData);
      
      if (result.success) {
        toast.update(loadingToastId, {
          render: 'Test notification sent successfully!',
          type: 'success',
          isLoading: false,
          autoClose: 5000
        });
      } else {
        throw new Error(result.error || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Test notification failed:', error);
      toast.error('Failed to send test notification: ' + error.message);
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

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (inputContainerRef.current) {
        setInputHeight(inputContainerRef.current.offsetHeight);
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    if (inputContainerRef.current) observer.observe(inputContainerRef.current);
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      viewport?.removeEventListener('resize', updateHeight);
    };
  }, [selectedFilePreview, isKeyboardVisible, hideNav]);

  useEffect(() => {
    if (inView) {
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, inView]);

  useEffect(() => {
    if (inView) {
      scrollToNewestMessage();
    }
  }, [inputHeight, isKeyboardVisible, hideNav]);

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
  if (uploading) return;
  if ((!newMessage.trim() && !selectedFile) || !user || !userProfile) return;

  const tempId = `temp-${Date.now()}`;
  const tempMsg = {
    id: tempId,
    text: newMessage.trim() || null,
    senderId: user.uid,
    timestamp: new Date(),
    edited: false,
    deleted: false,
    saved: false,
    status: 'sending',
    type: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
    fileURL: selectedFile ? selectedFilePreview : null,
    fileName: selectedFile ? selectedFile.name : null,
    fileType: selectedFile ? selectedFile.type : null,
    senderProfile: { profilePhotoURL: userProfile?.profilePhotoURL, username: userProfile?.username }
  };
  setMessages(prev => [...prev, tempMsg]);

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
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        toast.error('Failed to upload file. Please try again.');
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
      status: 'sent',
      type: fileURL ? (newMessage.trim() ? 'mixed' : fileType) : 'text'
    };

    if (fileURL) {
      messageData.fileURL = fileURL;
      messageData.fileName = selectedFile.name;
      messageData.fileType = selectedFile.type;
    }

    const docRef = await addDoc(messagesRef, messageData);
    setLastMessageId(docRef.id);
    setMessages(prev => prev.filter(m => m.id === tempId ? false : true));

    try {
      await sendSound.current.play();
    } catch (err) {
      console.log('Audio play failed:', err);
    }

    if (partner && partner.uid) {
      try {
        const notificationData = {
          title: userProfile?.displayName || 'New message',
          body: messageData.type === 'image' ? '📷 Image' :
            messageData.type === 'file' ? '📎 File' :
            messageData.text && messageData.text.length > 30 ?
              `${messageData.text.substring(0, 27)}...` : messageData.text || 'New message',
          data: {
            type: 'message',
            messageId: docRef.id,
            messageType: messageData.type,
            clickAction: '/chat',
            timestamp: Date.now()
          }
        };

        await sendNotification(partner.uid, notificationData);
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }

    setNewMessage('');
    removeSelectedFile();

  } catch (error) {
    console.error('Error sending message:', error);
    setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    toast.error('Failed to send message');
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

  const retryMessage = async (msg) => {
    if (!msg || msg.status !== 'failed' || msg.type !== 'text') return;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sending' } : m));
    try {
      const messagesRef = collection(db, 'messages');
      const messageData = {
        text: msg.text,
        senderId: user.uid,
        timestamp: serverTimestamp(),
        edited: false,
        deleted: false,
        saved: false,
        status: 'sent',
        type: 'text'
      };
      const docRef = await addDoc(messagesRef, messageData);
      setLastMessageId(docRef.id);
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    } catch (error) {
      console.error('Error retrying message:', error);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
      toast.error('Failed to send message');
    }
  };

  const handleCopyMessage = async (message) => {
    try {
      if (message.text) {
        await navigator.clipboard.writeText(message.text);
        toast.success('Copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to copy message:', error);
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

  // In ChatRoom.jsx, modify the useEffect that fetches messages to also set the partner

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
            
            // Set partner if this user is not the current user
            if (userId !== user.uid) {
              setPartner({
                uid: userId,
                ...userDoc.data()
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching profile for user ${userId}:`, error);
        }
      }
    }

    // The rest of your code remains the same
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
        // Determine the other user's ID (sender or receiver)
        const otherUserId = message.senderId === user.uid
          ? message.receiverId
          : message.senderId;

        // If we can't determine the other user, avoid calling Firestore with undefined
        if (!otherUserId) {
          console.warn('Could not determine other user from latest message');
          return;
        }

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

  const MessageStatus = ({ status, isLastMessage, onRetry }) => {
    if (!isLastMessage) return null;
    let content = null;
    switch (status) {
      case 'sending':
        content = 'Sending...';
        break;
      case 'sent':
      case 'delivered':
        content = 'Sent';
        break;
      case 'read':
        content = 'Seen';
        break;
      case 'failed':
        content = (
          <button onClick={onRetry} className="underline">
            Retry
          </button>
        );
        break;
      default:
        content = null;
    }
    if (!content) return null;
    return (
      <div className={`text-[11px] ${
        darkMode ? 'text-white/80' : 'text-gray-500'
      }`}>
        {content}
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
    
    // Check if document exists first, create if it doesn't
    getDoc(typingRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          // Update existing document
          updateDoc(typingRef, {
            timestamp: serverTimestamp()
          });
        } else {
          // Create new document
          setDoc(typingRef, {
            timestamp: serverTimestamp(),
            userId: user.uid
          });
        }
      })
      .catch(error => {
        console.error("Error updating typing status:", error);
      });
  
    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Set new timeout
    const timeout = setTimeout(() => {
      getDoc(typingRef).then(docSnap => {
        if (docSnap.exists()) {
          updateDoc(typingRef, {
            timestamp: null
          }).catch(err => console.error("Error clearing typing status:", err));
        }
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
      
      // Disable the nudge button immediately to prevent multiple clicks
      const nudgeButton = document.getElementById('nudge-button');
      if (nudgeButton) nudgeButton.disabled = true;
      
      // Show a loading toast
      const loadingToastId = toast.loading('Sending nudge...');
      
      try {
        // Always use a fresh timestamp for nudges
        const nudgeData = {
          title: userProfile?.displayName || "Your partner",
          body: '👋 Hey! Come answer me!',
          data: {
            type: 'nudge',
            priority: 'high',
            vibrate: [200, 100, 200, 100, 200],
            timestamp: Date.now(),
            clickAction: '/chat?nudged=true'
          }
        };
        
        console.log(`Attempting to nudge partner with ID: ${partner.uid}`);
        
        // Use the improved sendNotification function
        const result = await sendNotification(partner.uid, nudgeData);
      
        // Update the toast based on the result
        if (result.success) {
          toast.update(loadingToastId, {
            render: 'Nudge sent successfully!',
            type: 'success',
            isLoading: false,
            autoClose: 3000
          });
        } else {
          let errorMessage = 'Failed to send nudge';
          
          if (result.error === 'Partner has not enabled notifications') {
            errorMessage = 'Your partner has not enabled notifications';
          } else if (result.error === 'User not found') {
            errorMessage = 'Your partner account was not found';
          } else if (result.error) {
            errorMessage = `Nudge failed: ${result.error}`;
          }
          
          toast.update(loadingToastId, {
            render: errorMessage,
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Error sending nudge:', error);
        toast.update(loadingToastId, {
          render: `Failed to send nudge: ${error.message}`,
          type: 'error',
          isLoading: false,
          autoClose: 3000
        });
      } finally {
        // Re-enable the nudge button after 5 seconds regardless of outcome
        setTimeout(() => {
          const button = document.getElementById('nudge-button');
          if (button) button.disabled = false;
        }, 5000);
      }
    } catch (error) {
      console.error('Error in handleNudge:', error);
      toast.error('Could not send nudge at this time');
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Function to refresh the token
    const refreshToken = async () => {
      try {
        await refreshFCMToken();
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    };
    
    // Refresh token immediately
    refreshToken();
    
    // Refresh token every 24 hours
    const tokenRefreshInterval = setInterval(refreshToken, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(tokenRefreshInterval);
  }, [user]);

  useEffect(() => {
    const viewport = window.visualViewport;

    const handleResize = () => {
      if (viewport) {
        const heightDiff =
          window.innerHeight - viewport.height - viewport.offsetTop;
        const keyboard = heightDiff > 100;
        setViewportHeight(viewport.height);
        setKeyboardHeight(keyboard ? heightDiff : 0);
        setIsKeyboardVisible(keyboard);
      } else {
        const isKeyboard = window.innerHeight < window.outerHeight * 0.75;
        setIsKeyboardVisible(isKeyboard);
      }
    };

    if (viewport) {
      viewport.addEventListener('resize', handleResize);
      viewport.addEventListener('scroll', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    handleResize();

    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', handleResize);
        viewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  useEffect(() => {
    const fetchAndTrackPartner = async () => {
      if (!user) return;
      
      try {
        // Look for other users in the database
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        // Find a user that isn't the current user
        usersSnapshot.forEach(userDoc => {
          if (userDoc.id !== user.uid) {
            const data = userDoc.data();
            
            // Set partner data
            setPartner({
              uid: userDoc.id,
              ...data
            });
            
            // Check if partner is active
            if (data.lastActive) {
              const lastActive = data.lastActive.toDate();
              const now = new Date();
              const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
              
              setIsPartnerActive(diffInMinutes < 2);
              
              // Set other user status
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
        
        // Set up a listener for partner status updates
        if (partner?.uid) {
          const partnerRef = doc(db, 'users', partner.uid);
          return onSnapshot(partnerRef, (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              
              // Update partner data
              setPartner(current => ({
                ...current,
                ...data
              }));
              
              // Check if partner is active
              if (data.lastActive) {
                const lastActive = data.lastActive.toDate();
                const now = new Date();
                const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
                
                setIsPartnerActive(diffInMinutes < 2);
                
                // Update other user status
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
        }
      } catch (error) {
        console.error('Error setting up partner tracking:', error);
      }
    };
  
    fetchAndTrackPartner();
  }, [user, partner?.uid]);

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
    <div
      className={`fixed top-0 left-0 right-0 flex flex-col ${darkMode ? 'dark' : ''}`}
      style={{ height: viewportHeight }}
    >
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
              paddingBottom: `${inputHeight + (hideNav ? 0 : NAV_BAR_HEIGHT)}px`,
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
                  <React.Fragment key={message.id}>
                    {isNewDay(messages, index) && (
                      <div className="flex items-center my-4">
                        <div className="flex-grow border-t border-gray-300/40" />
                        <span className="mx-2 text-xs text-gray-400">
                          {formatDateDivider(message.timestamp instanceof Timestamp ? message.timestamp.toDate() : message.timestamp)}
                        </span>
                        <div className="flex-grow border-t border-gray-300/40" />
                      </div>
                    )}
                    {shouldShowClusterTime(messages, index) && (
                      <div className="text-center text-xs text-gray-400 mb-2">
                        {(message.timestamp instanceof Timestamp ? message.timestamp.toDate() : message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    <div
                      id={`message-${message.id}`}
                      className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                      {message.senderId !== user?.uid && (
                        <div className="w-8 h-8 rounded-full mr-2 overflow-hidden flex-shrink-0">
                          {message.senderProfile?.profilePhotoURL ? (
                            <img src={message.senderProfile.profilePhotoURL} alt="Profile" className="w-full h-full object-cover" />
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
                        className={`message-bubble relative max-w-[75%] rounded-[12px] px-4 py-2 ${
                          message.senderId === user?.uid
                            ? 'bg-[#4E82EA] text-white rounded-br-none'
                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none shadow-sm'
                        } ${message.saved ? 'border border-yellow-400' : ''} ${
                          pressedMessageId === message.id ? 'scale-95' : 'scale-100'
                        } transition-all duration-200`}
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
                              ? 'border-white/20 text-white/80'
                              : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
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
                                        ? 'border-white/50 text-white placeholder-white/50'
                                        : 'border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400'
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
                                    ? 'text-white/90 hover:text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                                }`}
                              >
                                <Paperclip size={16} />
                                {message.fileName}
                              </a>
                            )}

                            {message.edited && (
                              <div className={`text-xs mt-1 ${
                                message.senderId === user?.uid
                                  ? 'text-white/60'
                                  : 'text-gray-500 dark:text-gray-400'
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
                      </div>
                    </div>
                    {message.senderId === user?.uid && (
                      <div className="flex justify-end mb-2">
                        <MessageStatus status={message.status} isLastMessage={index === messages.length - 1} onRetry={() => retryMessage(message)} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
                {isTyping && (
                  <div className="flex justify-start mb-2">
                    <div className="bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-[12px] rounded-bl-none px-4 py-2 shadow-sm flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:400ms]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Message Input */}
        <div
          ref={inputContainerRef}
          className={`fixed left-0 right-0 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          } border-t z-50 transition-all duration-300`}
          style={{
            bottom: isKeyboardVisible
              ? `${keyboardHeight}px`
              : hideNav
                ? 'env(safe-area-inset-bottom)'
                : 'calc(72px + env(safe-area-inset-bottom))'
          }}
        >
          <div
            className="max-w-2xl mx-auto px-4 py-3"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
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
                  onFocus={() => setHideNav && setHideNav(true)}
                  onBlur={() => setHideNav && setHideNav(false)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // Prevent multiple rapid submissions
                      if (!uploading) {
                        handleSend();
                      }
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
                    <Camera size={20} />
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
          accept="image/*"
          capture="environment"
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
          onCopy={() => handleCopyMessage(selectedMessage)}
          onDelete={() => handleDeleteMessage(selectedMessage?.id)}
          onReact={(reaction) => handleReaction(selectedMessage?.id, reaction)}
          position={actionPosition}
          isOwnMessage={selectedMessage?.senderId === user?.uid}
        />

          {/* Image Preview Dialog */}
          {imagePreview && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
              style={{ paddingBottom: `${inputHeight + (hideNav ? 0 : NAV_BAR_HEIGHT)}px` }}
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
                className="max-w-[90%] max-h-[calc(100dvh-160px)] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
      </div>
    </div>
  );
};

export default ChatRoom;