import React, { useState } from 'react';
import { Calendar, Clock, Image, MessageSquare, Mic, Video, Lock, Send, Heart, X, Camera, Home, Map, User, Circle } from 'lucide-react';
import MediaCapture from './components/MediaCapture';
import MediaPreview from './components/MediaPreview';
<<<<<<< HEAD
=======
import Navigation from './components/Navigation';
>>>>>>> 3f909a9 (Initial commit)

const App = () => {
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [mediaType, setMediaType] = useState('text');
  const [mediaPreview, setMediaPreview] = useState(null);
<<<<<<< HEAD
=======
  const [currentPage, setCurrentPage] = useState('home');
>>>>>>> 3f909a9 (Initial commit)

  const handlePost = () => {
    if ((!message && !mediaPreview) || !selectedDate) return;
    
    console.log('New post:', {
      type: mediaType,
      content: message,
      scheduledFor: selectedDate,
      mediaUrl: mediaPreview
    });
    
    setMessage('');
    setSelectedDate('');
    setMediaPreview(null);
    setMediaType('text');
  };

  const clearMediaPreview = () => {
    setMediaPreview(null);
  };

<<<<<<< HEAD
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header stays the same */}
        <div className="bg-white/80 backdrop-blur-sm border-none shadow-lg rounded-lg">
          <div className="p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="text-rose-500" size={24} />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Our Timeline
              </h1>
            </div>
            <Lock className="text-blue-500" size={24} />
          </div>
        </div>

        {/* Post Creation Card */}
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none">
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
              className="w-full p-4 border rounded-xl resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />

            {/* Date and Submit */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
                <Calendar size={20} className="text-blue-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-none focus:ring-0 text-gray-600"
                />
              </div>
              <button
                onClick={handlePost}
                className="ml-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl 
                          flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:transform hover:scale-105"
              >
                <Send size={20} />
                Schedule Post
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border-none shadow-md rounded-lg p-4">
          <div className="text-blue-800 flex items-center gap-2">
            <Lock size={16} />
            Your private space: only visible to you and your partner
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-around shadow-lg">
            <button className="p-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
              <Circle size={24} />
            </button>

            <button className="p-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
              <Map size={24} />
            </button>

            <button className="p-3 bg-blue-500 text-white rounded-full transform -translate-y-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-blue-600">
              <Home size={28} />
            </button>

            <button className="p-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
              <Calendar size={24} />
            </button>

            <button className="p-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
              <User size={24} />
            </button>                           
          </div>         
        </div>
      </div>
    </div>
=======
  const renderPage = () => {
    switch (currentPage) {
      case 'menu':
        return <div className="text-center p-4">Menu Coming Soon</div>;
      case 'map':
        return <div className="text-center p-4">Map Coming Soon</div>;
      case 'calendar':
        return <div className="text-center p-4">Calendar Coming Soon</div>;
      case 'profile':
        return <div className="text-center p-4">Profile Coming Soon</div>;
      default:
        return (
          // Your existing timeline content
          <>
            <div className="bg-white/80 backdrop-blur-sm border-none shadow-lg rounded-lg">
              {/* ... rest of your existing content ... */}
            </div>
            {/* Rest of your existing JSX */}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {currentPage === 'home' ? (
          <>
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-none shadow-lg rounded-lg">
              <div className="p-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="text-rose-500" size={24} />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Our Timeline
                  </h1>
                </div>
                <Lock className="text-blue-500" size={24} />
              </div>
            </div>
  
            {/* Post Creation Card */}
            <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none">
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
                  className="w-full p-4 border rounded-xl resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
  
                {/* Date and Submit */}
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
                    <Calendar size={20} className="text-blue-500" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border-none focus:ring-0 text-gray-600"
                    />
                  </div>
                  <button
                    onClick={handlePost}
                    className="ml-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl 
                              flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:transform hover:scale-105"
                  >
                    <Send size={20} />
                    Schedule Post
                  </button>
                </div>
              </div>
            </div>
  
            {/* Privacy Notice */}
            <div className="bg-blue-50 border-none shadow-md rounded-lg p-4">
              <div className="text-blue-800 flex items-center gap-2">
                <Lock size={16} />
                Your private space: only visible to you and your partner
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="text-2xl font-bold text-gray-800 mb-4">
              {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
            </div>
            <p className="text-gray-600">Coming Soon</p>
          </div>
        )}
      </div>
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </div>
>>>>>>> 3f909a9 (Initial commit)
  );
};

export default App;