import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Clock,
  MapPin,
  Trash2, 
  Edit2, 
  X,
  CalendarDays,
  Users,
  AlignLeft,
  Sun, 
  Moon, 
  Sunrise, 
  Sunset,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '../context/DarkModeContext';
import ParticipantsModal from './ParticipantsModal';

const NOTIFICATION_OPTIONS = [
  { value: '2880', label: '2 days before' },
  { value: '1440', label: '1 day before' },
  { value: '240', label: '4 hours before' },
  { value: '120', label: '2 hours before' },
  { value: '60', label: '1 hour before' },
  { value: '30', label: '30 minutes before' },
  { value: '15', label: '15 minutes before' }
];

const REPEAT_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'weekly', label: 'Every Week' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Every Month' },
  { value: 'yearly', label: 'Every Year' }
];

const SharedCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showDayView, setShowDayView] = useState(false);
  const { darkMode } = useDarkMode();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    isAllDay: false,
    startTime: "",
    endTime: "",
    location: "",
    type: "general",
    notifications: [],
    repeat: 'never',
    description: ""
  });

  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const removeParticipant = (participantId) => {
    setNewEvent(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== participantId)
    }));
  };

  const handleParticipantSelect = (user) => {
    setNewEvent(prev => ({
      ...prev,
      participants: prev.participants?.some(p => p.id === user.id)
        ? prev.participants.filter(p => p.id !== user.id)
        : [...(prev.participants || []), { id: user.id, name: user.displayName }]
    }));
  };

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

  const handleDateClick = (date) => {
    if (date) {
      setSelectedDate(date);
      setShowDayView(true);
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
        updatedAt: new Date().toISOString(),
        notificationTimes: newEvent.notifications.map(minutes => {
          const eventDate = new Date(newEvent.date);
          if (!newEvent.isAllDay && newEvent.startTime) {
            const [hours, mins] = newEvent.startTime.split(':');
            eventDate.setHours(parseInt(hours), parseInt(mins));
          }
          const notificationDate = new Date(eventDate.getTime() - (parseInt(minutes) * 60000));
          return notificationDate.toISOString();
        })
      };
  
      await addDoc(collection(db, 'events'), eventData);
      
      setNewEvent({
        title: "",
        date: "",
        isAllDay: false,
        startTime: "",
        endTime: "",
        location: "",
        type: "general",
        notifications: [],
        repeat: 'never',
        description: ""
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
        isAllDay: false,
        startTime: "",
        endTime: "",
        location: "",
        type: "general",
        notifications: [],
        repeat: 'never',
        description: ""
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
      {/* Main Calendar View */}
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-4 flex-1 overflow-y-auto pb-32"
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

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 mb-2">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
              <div key={day} className={`text-center text-xs font-medium ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 mb-8">
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

          {/* Events List */}
          <div className={`w-full h-px ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} my-8`} />
          
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
                    className={`${darkMode ? 'bg-gray-800' : 'bg-blue-900'} text-white p-4 rounded-xl space-y-3`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-white">
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

                    {/* Time */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={14} />
                      <span>{formatTime(event)}</span>
                    </div>

                    {/* Location */}
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {/* Participants */}
                    {event.participants?.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users size={14} />
                        <div className="flex flex-wrap gap-1">
                          {event.participants.map((participant, index) => (
                            <span key={participant.id} className="text-blue-200">
                              {participant.name}{index < event.participants.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Repeat */}
                    {event.repeat && event.repeat !== 'never' && (
                      <div className="flex items-center gap-2 text-sm">
                        <RefreshCw size={14} />
                        <span>{REPEAT_OPTIONS.find(option => option.value === event.repeat)?.label}</span>
                      </div>
                    )}

                    {/* Description */}
                    {event.description && (
                      <div className="mt-2 text-sm text-blue-200 border-t border-blue-800/50 pt-2">
                        {event.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl my-8 mb-32`}>
            {/* Basic Info Section */}
            <div className="p-4 space-y-4">
              {/* Title, Date, Time, All Day toggle remain the same */}
              
              {/* Advanced Options Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className={`w-full flex items-center justify-between p-4 ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                } rounded-xl transition-colors`}
              >
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Advanced Options
                </span>
                <ChevronDown 
                  className={`transform transition-transform ${showAdvancedOptions ? 'rotate-180' : ''} ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} 
                />
              </button>

              {/* Collapsible Advanced Options */}
              <AnimatePresence>
                {showAdvancedOptions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Notifications, Repeat, Participants, Location, Description */}
                    {/* ... existing advanced options ... */}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                      type: "general",
                      notifications: [],
                      repeat: 'never',
                      description: ""
                    });
                  }}
                  className={`flex-1 py-3 rounded-xl ${
                    darkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    if (isEditing) {
                      handleUpdateEvent(e);
                    } else {
                      handleAddEvent(e);
                    }
                  }}
                  disabled={!newEvent.title || !newEvent.date || isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 
                    disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipantsModal && (
        <ParticipantsModal
          isOpen={showParticipantsModal}
          onClose={() => setShowParticipantsModal(false)}
          onSelect={handleParticipantSelect}
          selectedParticipants={newEvent.participants || []}
        />
      )}
    </div>
  );
};

export default SharedCalendar;