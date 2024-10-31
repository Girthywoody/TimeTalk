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

const SharedCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
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
      setNewEvent(prev => ({
        ...prev,
        date: date.toISOString().split('T')[0]
      }));
      setIsEditing(false);
      setShowEventForm(true);
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
        time: "",
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

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${period}`;
  };
  
  return (
    <div className="h-screen bg-white">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-4 h-full pb-20">

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                {getGreeting().icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {getGreeting().text}
                </h1>
                <h2 className="text-lg text-gray-600">
                  {profileData?.displayName}
                </h2>
              </div>
            </div>
            <Bell className="text-gray-600 hover:text-blue-600 transition-colors" size={24} />
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
                    ? 'bg-blue-900 text-white' 
                    : 'bg-gray-100 text-gray-600'}`}
              >
                {month}
              </button>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="mb-4">
            <div className="grid grid-cols-7 mb-2">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {generateCalendarDays().map((date, index) => {
                const dayEvents = date ? getDayEvents(date) : [];
                const isToday = date?.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`aspect-square p-2 rounded-xl flex flex-col items-center justify-center
                      ${date ? 'cursor-pointer hover:bg-gray-50' : ''}
                      ${isToday ? 'bg-blue-100' : ''}
                      ${dayEvents.length > 0 ? 'ring-2 ring-blue-200' : ''}`}
                  >
                    {date && (
                      <>
                        <span className={`text-sm ${isToday ? 'text-blue-600 font-bold' : ''}`}>
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
          </div>

          {/* Today's Meetings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Today Meeting</h3>
              <button
                onClick={() => {
                  setNewEvent(prev => ({
                    ...prev,
                    date: new Date().toISOString().split('T')[0]
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
            
            {getDayEvents(new Date()).map((event) => (
              <div
                key={event.id}
                className="bg-blue-900 text-white p-4 rounded-xl mb-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{event.title}</h4>
                  <div className="flex gap-2">
                    <Edit2 
                      size={18} 
                      className="cursor-pointer"
                      onClick={() => {
                        setNewEvent(event);
                        setIsEditing(true);
                        setShowEventForm(true);
                      }}
                    />
                    <Trash2 
                      size={18} 
                      className="cursor-pointer"
                      onClick={() => handleDeleteEvent(event.id)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} />
                  <span>{formatTime(event.time)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <MapPin size={14} />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-around">
            <button className="flex flex-col items-center text-blue-900">
              <CalendarIcon size={24} />
              <span className="text-xs mt-1">Home</span>
            </button>
            <button className="flex flex-col items-center text-gray-400">
              <Calendar size={24} />
              <span className="text-xs mt-1">Schedule</span>
            </button>
            <button className="flex flex-col items-center text-gray-400">
              <Heart size={24} />
              <span className="text-xs mt-1">Profile</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-blue-900">
                {isEditing ? 'Edit Event' : 'New Event'}
              </h3>
              <button
                onClick={() => {
                  setShowEventForm(false);
                  setIsEditing(false);
                  setNewEvent({
                    title: "",
                    date: "",
                    time: "",
                    location: "",
                    type: "general"
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={isEditing ? handleUpdateEvent : handleAddEvent} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Enter event title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={e => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Enter location"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Event Type</label>
                <select
                  value={newEvent.type}
                  onChange={e => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  <option value="general">General</option>
                  <option value="meeting">Meeting</option>
                  <option value="personal">Personal</option>
                  <option value="important">Important</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventForm(false);
                    setIsEditing(false);
                    setNewEvent({
                      title: "",
                      date: "",
                      time: "",
                      location: "",
                      type: "general"
                    });
                  }}
                  className="flex-1 p-4 border rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 p-4 bg-blue-900 text-white rounded-xl hover:bg-blue-800 font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (isEditing ? 'Update Event' : 'Add Event')}
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