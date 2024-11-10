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
import PageLayout from '../layout/PageLayout';


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
        // Verify PWA mode
        const isPWA = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        if (!isPWA) {
            throw new Error('Please open the app from your home screen to enable notifications');
        }

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Notification permission denied');
        }

        // Get FCM token
        const token = await requestNotificationPermission();
        if (!token) {
            throw new Error('Failed to get notification token');
        }

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
                    badge: '1',
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
    } catch (error) {
        console.error('Test notification failed:', error);
        throw error;
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
        const idToken = await user.getIdToken(true);
        const timestamp = Date.now().toString();
        
        const response = await fetch('https://us-central1-timetalk-13a75.cloudfunctions.net/api/sendNotification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                userId: partner?.uid,
                notification: {
                    title: user.displayName || 'Your partner',
                    body: 'Hey! Come answer me!',
                    data: {
                        type: 'nudge',
                        senderId: user.uid,
                        timestamp: timestamp
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
    <PageLayout>
      <div className="min-h-screen">
        {/* Your existing ChatRoom content */}
        {/* ... */}
      </div>
    </PageLayout>
  );
};

export default ChatRoom;