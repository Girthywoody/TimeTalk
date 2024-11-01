import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Heart, 
  Lock, 
  Trash2, 
  Edit2, 
  X,
  CalendarDays as Calendar
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';


const SharedCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState(null);
  const [showDayView, setShowDayView] = useState(false);  
  const { darkMode } = useDarkMode();
  const [selectedDate, setSelectedDate] = useState(new Date());  // Default to today
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    isAllDay: false,
    startTime: "",
    endTime: "",
    location: "",
    type: "general"
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const profileDoc = await getDoc(userRef);
      if (profileDoc.exists()) {
        setProfileData(profileDoc.data());
      }
    };

    fetchProfile();
  }, []);

  const handleDateClick = (date) => {
    if (date) {
      setSelectedDate(date);
      setShowDayView(true); // Add this line to show the day view modal
    }
  };


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        text: 'Good Morning',
        icon: <Sun className="text-yellow-500" size={28} />
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        text: 'Good Afternoon',
        icon: <Sunrise className="text-orange-500" size={28} />
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        text: 'Good Evening',
        icon: <Sunset className="text-purple-500" size={28} />
      };
    } else {
      return {
        text: 'Good Night',
        icon: <Moon className="text-blue-400" size={28} />
      };
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(fetchedEvents);
    });

    return () => unsubscribe();
  }, []);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    
    if (!newEvent.isAllDay && newEvent.startTime && !newEvent.endTime) {
      alert('Please specify an end time');
      return;
    }
  
    if (!newEvent.isAllDay && newEvent.startTime > newEvent.endTime) {
      alert('End time must be after start time');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const eventData = {
        ...newEvent,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
  
      await addDoc(collection(db, 'events'), eventData);
      
      setNewEvent({
        title: "",
        date: "",
        isAllDay: false,
        startTime: "",
        endTime: "",
        location: "",
        type: "general"
      });
      setShowEventForm(false);
    } catch (error) {
      console.error("Error adding event: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    setIsSubmitting(true);
    try {
      const eventRef = doc(db, 'events', newEvent.id);
      const eventData = {
        ...newEvent,
        userId: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      };
      delete eventData.id;

      await updateDoc(eventRef, eventData);
      
      setShowEventForm(false);
      setIsEditing(false);
      setNewEvent({
        title: "",
        date: "",
        time: "",
        location: "",
        type: "general"
      });
    } catch (error) {
      console.error("Error updating event: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (error) {
      console.error("Error deleting event: ", error);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const days = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getDayEvents = (date) => {
    if (!date) return [];
    const formattedDate = date.toISOString().split('T')[0];
    return events.filter(event => event.date === formattedDate);
  };

  const formatTime = (event) => {
    if (event.isAllDay) return 'All Day';
    if (!event.startTime) return '';
    
    const formatTimeStr = (timeStr) => {
      const [hours, minutes] = timeStr.split(':');
      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${minutes} ${period}`;
    };
  
    const startTimeFormatted = formatTimeStr(event.startTime);
    const endTimeFormatted = event.endTime ? formatTimeStr(event.endTime) : '';
    
    return endTimeFormatted ? `${startTimeFormatted} - ${endTimeFormatted}` : startTimeFormatted;
  };
  
  return (
    <div className={`h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white'} overflow-x-hidden overflow-y-auto flex flex-col pb-16`}>
      <AnimatePresence mode="wait">
         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="p-4 flex-1 overflow-y-auto pb-32" // Increased bottom padding
          >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-50 to-purple-50'} rounded-xl`}>
                {getGreeting().icon}
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>
                  {getGreeting().text}
                </h1>
                <h2 className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {profileData?.displayName}
                </h2>
              </div>
            </div>
            <Bell className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'} transition-colors`} size={24} />
          </div>

          {/* Month Selector */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {months.map((month, index) => (
              <button
                key={month}
                onClick={() => {
                  const newDate = new Date(currentDate.setMonth(index));
                  setCurrentDate(newDate);
                }}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap
                  ${currentDate.getMonth() === index 
                    ? 'bg-blue-600 text-white' 
                    : darkMode 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {month}
              </button>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 mb-2">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
              <div key={day} className={`text-center text-xs font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-8"> {/* Added larger margin bottom */}
            {generateCalendarDays().map((date, index) => {
              const dayEvents = date ? getDayEvents(date) : [];
              const isToday = date?.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`aspect-square p-2 rounded-xl flex flex-col items-center justify-center
                    ${date ? darkMode 
                      ? 'cursor-pointer hover:bg-gray-800' 
                      : 'cursor-pointer hover:bg-gray-50' 
                      : ''
                    }
                    ${isToday ? darkMode 
                      ? 'bg-blue-900/50' 
                      : 'bg-blue-100' 
                      : ''
                    }
                    ${dayEvents.length > 0 ? 'ring-2 ring-blue-500/50' : ''}`}
                >
                  {date && (
                    <>
                      <span className={`text-sm ${
                        isToday 
                          ? 'text-blue-400 font-bold' 
                          : darkMode 
                            ? 'text-gray-300' 
                            : 'text-gray-700'
                      }`}>
                        {date.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1" />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className={`w-full h-px ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} my-8`} />


          {/* Selected Date Meetings */}
          <div className="max-h-[calc(100vh-460px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {selectedDate.toDateString() === new Date().toDateString() 
                  ? "Today's Events" 
                  : selectedDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric'
                    }) + "'s Events"
                }
              </h3>
              <button
                onClick={() => {
                  setNewEvent(prev => ({
                    ...prev,
                    date: selectedDate.toISOString().split('T')[0]
                  }));
                  setIsEditing(false);
                  setShowEventForm(true);
                }}
                className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors"
              >
                <Plus size={20} />
                <span>Add Event</span>
              </button>
            </div>
            
            {getDayEvents(selectedDate).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No events scheduled for this day</p>
            ) : (
              <div className="space-y-3">
                {getDayEvents(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className={`${darkMode ? 'bg-gray-800' : 'bg-blue-900'} text-white p-4 rounded-xl`}
                  >
                    <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-semibold text-white`}> 
                      {event.title}
                    </h4>
                      <div className="flex gap-2">
                        <Edit2 
                          size={18} 
                          className="cursor-pointer hover:text-blue-200 transition-colors"
                          onClick={() => {
                            setNewEvent(event);
                            setIsEditing(true);
                            setShowEventForm(true);
                          }}
                        />
                        <Trash2 
                          size={18} 
                          className="cursor-pointer hover:text-blue-200 transition-colors"
                          onClick={() => handleDeleteEvent(event.id)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={14} />
                      <span>{formatTime(event)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <MapPin size={14} />
                        <span>{event.location}</span>
                      </div>
                    )}
                    <div className="mt-2 text-sm text-blue-200">
                      Type: {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className={`sticky bottom-16 left-0 right-0 ${darkMode ? 'bg-gray-900' : 'bg-white'} border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} p-4 mt-8 flex justify-around`}>
            <button className={`flex flex-col items-center ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>
              <CalendarIcon size={24} />
              <span className="text-xs mt-1">Home</span>
            </button>
            <button className={`flex flex-col items-center ${darkMode ? 'text-gray-500' : 'text-gray-400'} hover:text-blue-500 transition-colors`}>
              <Calendar size={24} />
              <span className="text-xs mt-1">Schedule</span>
            </button>
            <button className={`flex flex-col items-center ${darkMode ? 'text-gray-500' : 'text-gray-400'} hover:text-blue-500 transition-colors`}>
              <Heart size={24} />
              <span className="text-xs mt-1">Profile</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Selected Date Events Modal */}
{showDayView && selectedDate && (
  <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 mt-1">
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ type: "spring", duration: 0.3 }}
      className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-3xl p-4 w-full max-w-lg shadow-xl`}
      >
    <div className="flex items-center justify-between mb-6">
      <h3 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-blue-900'}`}>
          {selectedDate.toLocaleDateString('en-US', { 
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </h3>
        <button
          onClick={() => setShowDayView(false)}
          className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full transition-colors`}
          >
           <X size={24} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
        </button>
      </div>

      <div className="space-y-4">
        {getDayEvents(selectedDate).length === 0 ? (
          <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No events scheduled for this day
          </p>
        ) : (
          getDayEvents(selectedDate).map((event) => (
              <div
                key={event.id}
                className={`${darkMode ? 'bg-gray-800' : 'bg-blue-50'} p-4 rounded-xl`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                {event.title}
              </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setNewEvent(event);
                      setIsEditing(true);
                      setShowDayView(false);
                      setShowEventForm(true);
                    }}
                    className={`p-1.5 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-100'} rounded-full transition-colors`}
                    >
        <Edit2 size={16} className={darkMode ? 'text-gray-300' : 'text-blue-700'} />
                  </button>
                  <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className={`p-1.5 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-100'} rounded-full transition-colors`}
                    >
                      <Trash2 size={16} className={darkMode ? 'text-gray-300' : 'text-blue-700'} />
                    </button>
                </div>
              </div>
              <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                <Clock size={14} />
                  <span>{formatTime(event)}</span>
              </div>
              {event.location && (
                <div className={`flex items-center gap-2 text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                  <MapPin size={14} />
                  <span>{event.location}</span>
                </div>
              )}
              <div className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-blue-600'}`}>
                Type: {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => {
            setNewEvent(prev => ({
              ...prev,
              date: selectedDate.toISOString().split('T')[0]
            }));
            setIsEditing(false);
            setShowDayView(false);
            setShowEventForm(true);
          }}
          className="w-full p-4 bg-blue-900 text-white rounded-xl hover:bg-blue-800 font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          <span>Add Event for This Day</span>
        </button>
      </div>
    </motion.div>
  </div>
)}


{/* Event Form Modal */}
{showEventForm && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ type: "spring", duration: 0.3 }}
      className={`${
        darkMode 
          ? 'bg-gray-900 text-white' 
          : 'bg-white text-gray-900'
      } rounded-3xl p-6 pb-6 w-full max-w-lg shadow-xl`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-2xl font-semibold ${
          darkMode ? 'text-white' : 'text-blue-900'
        }`}>
          {isEditing ? 'Edit Event' : 'New Event'}
        </h3>
        <button
          onClick={() => {
            setShowEventForm(false);
            setIsEditing(false);
            setNewEvent({
              title: "",
              date: "",
              isAllDay: false,
              startTime: "",
              endTime: "",
              location: "",
              type: "general"
            });
          }}
          className={`p-2 rounded-full transition-colors ${
            darkMode 
              ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
          }`}
        >
          <X size={24} />
        </button>
      </div>
      
      <form onSubmit={isEditing ? handleUpdateEvent : handleAddEvent} className="space-y-4">
        {/* Title Input */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Title
          </label>
          <input
            type="text"
            value={newEvent.title}
            onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
            className={`w-full p-2 rounded-xl focus:ring-2 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
            } border`}
            placeholder="Enter event title"
          />
        </div>

        {/* All Day Switch */}
        <div className={`flex items-center justify-between p-2 rounded-xl ${
          darkMode ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <label className={`text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            All Day
          </label>
          <button
            type="button"
            onClick={() => setNewEvent(prev => ({
              ...prev,
              isAllDay: !prev.isAllDay,
              startTime: "",
              endTime: ""
            }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${newEvent.isAllDay 
                ? 'bg-blue-600' 
                : darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${newEvent.isAllDay ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>

        {/* Date Input */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Date
          </label>
          <input
            type="date"
            value={newEvent.date}
            onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
            className={`w-full p-2 rounded-xl focus:ring-2 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            } border`}
          />
        </div>

        {/* Time Range */}
        {!newEvent.isAllDay && (
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Time
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={`block text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  From
                </label>
                <input
                  type="time"
                  value={newEvent.startTime}
                  onChange={e => {
                    const newStartTime = e.target.value;
                    setNewEvent(prev => ({
                      ...prev,
                      startTime: newStartTime,
                      endTime: prev.endTime && newStartTime > prev.endTime ? newStartTime : prev.endTime
                    }));
                  }}
                  className={`w-full p-2 rounded-xl focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } border`}
                />
              </div>
              <div className="space-y-1">
                <label className={`block text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  To
                </label>
                <input
                  type="time"
                  value={newEvent.endTime}
                  min={newEvent.startTime}
                  onChange={e => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                  className={`w-full p-2 rounded-xl focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } border`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Location Input */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Location
          </label>
          <input
            type="text"
            value={newEvent.location}
            onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
            className={`w-full p-2 rounded-xl focus:ring-2 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
            } border`}
            placeholder="Enter location"
          />
        </div>

        {/* Event Type Select */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Event Type
          </label>
          <select
            value={newEvent.type}
            onChange={e => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
            className={`w-full p-2 rounded-xl focus:ring-2 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            } border`}
          >
            <option value="general">General</option>
            <option value="meeting">Meeting</option>
            <option value="personal">Personal</option>
            <option value="important">Important</option>
          </select>
        </div>

        {/* Form Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowEventForm(false);
              setIsEditing(false);
              setNewEvent({
                title: "",
                date: "",
                isAllDay: false,
                startTime: "",
                endTime: "",
                location: "",
                type: "general"
              });
            }}
            className={`flex-1 p-4 rounded-xl font-medium transition-colors ${
              darkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                : 'border hover:bg-gray-50 text-gray-900'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Add Event')}
          </button>
        </div>
      </form>
    </motion.div>
  </div>
)}
    </div>
  );
};

export default SharedCalendar;