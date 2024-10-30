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
import { 
  Send, 
  Loader2, 
  X, 
  Paperclip, 
  Phone,
  Video,
  Bookmark,
  Maximize2
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

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

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const sendSound = useRef(new Audio('/sounds/swoosh.mp3'));
  const receiveSound = useRef(new Audio('/sounds/ding.mp3'));
  const { user } = useAuth();

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

    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `uploads/${user.uid}/${fileName}`;
    
    const storageRef = ref(storage, filePath);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    <div className="fixed inset-0 flex flex-col bg-[#F8F9FE]">
      {/* Header */}
      <div className="px-4 py-2 bg-white">
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
              <h1 className="text-gray-900 font-semibold">
                {userProfile?.username || userProfile?.displayName}
              </h1>
              <p className="text-sm text-green-500">Online</p>
            </div>
          </div>
  
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Phone size={20} className="text-blue-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Video size={20} className="text-blue-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-auto px-4 py-3"
          style={{
            scrollBehavior: 'smooth',
            overscrollBehavior: 'contain',
            paddingBottom: 'calc(2rem + 56px)'
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
                        : "bg-white text-gray-800 rounded-bl-none shadow-sm"}
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
                              bg-white rounded-full shadow-md p-1 text-sm cursor-pointer
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
                                    : "border-gray-300 text-gray-800 placeholder-gray-400"
                                } focus:outline-none`}
                                autoFocus
                              />
                            ) : (
                              <span className="text-[15px] leading-relaxed">{message.text}</span>
                            )}
                          </div>
                        )}

                        {(message.type === 'image' || message.type === 'mixed') && (
                          <>
                            <div className="rounded-lg overflow-hidden mt-1 relative group">
                              <img 
                                src={message.fileURL} 
                                alt="Shared image"
                                className="max-w-full rounded-lg cursor-pointer"
                                loading="lazy"
                                onClick={() => setImagePreview(message.fileURL)}
                              />
                              <button
                                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setImagePreview(message.fileURL)}
                              >
                                <Maximize2 size={16} />
                              </button>
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
                                : "text-gray-600 hover:text-gray-800"
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
                              : "text-gray-500"
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
                        : "text-gray-500"
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
      <div className="sticky bottom-0 left-0 right-0 pb-2 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-2">
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
                  className="absolute -top-2 -right-2 p-1 bg-gray-800 rounded-full text-white hover:bg-gray-900"
                >
                  <X size={14} />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                  />
                </div>            
            )}
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#F8F9FE] rounded-full flex items-center pl-4 pr-2">
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
                  className="flex-1 bg-transparent border-none py-2 text-gray-800 placeholder-gray-500 focus:outline-none"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
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
                    : "bg-gray-100 text-gray-400"}`}
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
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
        />
      </div>

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
          onClick={() => setImagePreview(null)}
        >
          <button 
            onClick={() => setImagePreview(null)}
            className="absolute right-4 top-4 text-white/80 hover:text-white z-10"
          >
            <X size={24} />
          </button>
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="max-w-[90%] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ChatRoom;