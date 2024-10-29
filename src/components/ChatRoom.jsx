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
  deleteDoc,
  where,
  Timestamp
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import MessageActions from './MessageActions';
import { Send, Lock, Loader2, Heart, Pencil, Trash2, X, Image, Paperclip, Bookmark } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const MESSAGES_LIMIT = 100;
const MESSAGE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [chatProfiles, setChatProfiles] = useState({});
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const { user } = useAuth();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionPosition, setActionPosition] = useState({ x: 0, y: 0 });
  const [editingMessage, setEditingMessage] = useState(null);
  const [pressedMessageId, setPressedMessageId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);  
  const sendSound = useRef(new Audio('/sounds/swoosh.mp3'));
  const receiveSound = useRef(new Audio('/sounds/ding.mp3'));
  const [lastMessageId, setLastMessageId] = useState(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
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
      await updateDoc(messageRef, {
        reaction: {
          emoji: reaction,
          userId: user.uid,
          timestamp: serverTimestamp()
        }
      });
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Add this function inside the ChatRoom component, before the return statement:

const handleFileUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file || !user || !userProfile) return;

  try {
    setUploading(true);
    
    // Create a reference to the storage location
    const storageRef = ref(storage, `chat/${user.uid}/${Date.now()}_${file.name}`);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Determine if it's an image or other file type
    const isImage = file.type.startsWith('image/');
    
    // Add the message to Firestore
    const messagesRef = collection(db, 'messages');
    const docRef = await addDoc(messagesRef, {
      senderId: user.uid,
      timestamp: serverTimestamp(),
      type: isImage ? 'image' : 'file',
      fileURL: downloadURL,
      fileName: file.name,
      fileType: file.type,
      saved: false // Add this to support the save feature
    });

    setLastMessageId(docRef.id);
    
    // Play send sound
    sendSound.current.play().catch(err => console.log('Audio play failed:', err));
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    // You might want to add error handling UI here
  } finally {
    setUploading(false);
  }
};

  // Initialize scroll position on component mount
  useEffect(() => {
    scrollToBottom();
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

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      // Handle new message sounds
      snapshot.docChanges().forEach((change) => {
        if (
          change.type === 'added' && 
          change.doc.data().senderId !== user.uid &&
          change.doc.id !== lastMessageId
        ) {
          receiveSound.current.play().catch(err => console.log('Audio play failed:', err));
        }
      });

      // Process messages
      snapshot.forEach(doc => {
        const data = doc.data();
        const messageTimestamp = data.timestamp?.toDate();
        
        // Only include messages that are either saved or within 24 hours
        if (data.saved || (messageTimestamp && (now - messageTimestamp) < MESSAGE_EXPIRATION_TIME)) {
          uniqueUserIds.add(data.senderId);
          newMessages.push({
            id: doc.id,
            ...data,
            timestamp: messageTimestamp
          });
        }
      });

      // Fetch user profiles
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

      // Update messages with user profiles
      const messagesWithProfiles = newMessages.map(msg => ({
        ...msg,
        senderProfile: newProfiles[msg.senderId]
      }));

      setMessages(messagesWithProfiles.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, lastMessageId]);


  const handleSend = async () => {
    if (!newMessage.trim() || !user || !userProfile) return;

    try {
      const messagesRef = collection(db, 'messages');
      const docRef = await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: user.uid,
        timestamp: serverTimestamp(),
        type: 'text',
        edited: false,
        deleted: false,
        saved: false
      });

      setLastMessageId(docRef.id);
      sendSound.current.play().catch(err => console.log('Audio play failed:', err));
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSaveMessage = async (messageId) => {
    if (!messageId) return;
    
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const currentSavedState = messageDoc.data().saved;
        await updateDoc(messageRef, {
          saved: !currentSavedState // Toggle the saved state
        });
      }
      
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error toggling save state:', error);
    }
  };


  const renderMessage = (message) => {
    const isOwnMessage = message.senderId === user?.uid;
    const senderProfile = message.senderProfile || chatProfiles[message.senderId];
  
    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-2`}
      >
        <div
          className={`message-bubble relative max-w-[80%] rounded-lg px-4 py-2 
            ${isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}
            ${pressedMessageId === message.id ? 'scale-95' : 'scale-100'}
            transition-all duration-200 active:scale-95`}
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
              {/* Text Messages */}
              {(message.type === 'text' || !message.type) && (
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
                      className="w-full bg-transparent border-b border-white focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    message.text
                  )}
                </div>
              )}
  
              {/* Image Messages */}
              {message.type === 'image' && (
                <img 
                  src={message.fileURL} 
                  alt="Shared image"
                  className="max-w-full rounded-lg mt-1"
                  loading="lazy"
                />
              )}
  
              {/* File Messages */}
              {message.type === 'file' && (
                <a 
                  href={message.fileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline mt-1"
                >
                  <Paperclip size={16} />
                  {message.fileName}
                </a>
              )}
  
              {message.edited && (
                <div className="text-xs opacity-50 mt-1">(edited)</div>
              )}
            </>
          )}
          
          {message.reaction && (
            <div className="absolute -top-3 -right-2 bg-white rounded-full shadow-md p-1 text-sm">
              {message.reaction.emoji}
            </div>
          )}
          
          <div className="text-xs opacity-75 mt-1">
            {message.timestamp?.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex flex-col pt-4 pb-28 bg-white/90 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 mb-4">
        <div className="bg-white/80 backdrop-blur-sm border-none shadow-lg rounded-lg">
          <div className="p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Private Chat
              </h1>
              <Lock className="text-blue-500" size={20} />
            </div>
            {userProfile && (
              <div className="flex items-center gap-2">
                {userProfile.profilePhotoURL ? (
                  <img 
                    src={userProfile.profilePhotoURL} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {userProfile.username?.[0] || userProfile.displayName?.[0] || '?'}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {userProfile.username || userProfile.displayName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
  
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="shadow-lg rounded-lg border-none h-full">
          <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto p-4 space-y-4 scroll-smooth"
          >
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"} mb-2`}
                  >
                    <div
                      className={`message-bubble relative max-w-[80%] rounded-lg px-4 py-2 
                        ${message.senderId === user?.uid ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}
                        ${message.saved ? "border-2 border-yellow-400" : ""}
                        ${pressedMessageId === message.id ? 'scale-95' : 'scale-100'}
                        transition-all duration-200 active:scale-95`}
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
                          {/* Text Messages */}
                          {(message.type === 'text' || !message.type) && (
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
                                  className="w-full bg-transparent border-b border-white focus:outline-none"
                                  autoFocus
                                />
                              ) : (
                                message.text
                              )}
                            </div>
                          )}
  
                          {/* Image Messages */}
                          {message.type === 'image' && (
                            <img 
                              src={message.fileURL} 
                              alt="Shared image"
                              className="max-w-full rounded-lg mt-1"
                              loading="lazy"
                            />
                          )}
  
                          {/* File Messages */}
                          {message.type === 'file' && (
                            <a 
                              href={message.fileURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm hover:underline mt-1"
                            >
                              <Paperclip size={16} />
                              {message.fileName}
                            </a>
                          )}
  
                          {message.edited && (
                            <div className="text-xs opacity-50 mt-1">(edited)</div>
                          )}
  
                          {message.saved && (
                            <div className="absolute -top-2 -right-2">
                              <Bookmark size={16} className="text-yellow-400 fill-yellow-400" />
                            </div>
                          )}
                        </>
                      )}
  
                      {message.reaction && (
                        <div className="absolute -top-3 -right-2 bg-white rounded-full shadow-md p-1 text-sm">
                          {message.reaction.emoji}
                        </div>
                      )}
  
                      <div className="text-xs opacity-75 mt-1">
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
      </div>
  
      {/* Message Input */}
      <div className="px-4 mt-4">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none p-4">
          <div className="flex gap-4">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 resize-none p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              rows="2"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Image size={20} />
              </button>
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || !userProfile || uploading}
                className={`p-3 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  newMessage.trim() && userProfile && !uploading
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                <Send size={20} />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
            />
          </div>
        </div>
      </div>
  
      {/* Message Actions Menu */}
      <MessageActions
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
    </div>
  );
};

export default ChatRoom;

