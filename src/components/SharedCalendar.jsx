import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Heart, 
  Lock, 
  Trash2, 
  Edit2, 
  X,
  CalendarDays as Calendar // Add this import
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from './Navigation';

const SharedCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayView, setShowDayView] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    type: "general"
  });

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
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

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
          {!showDayView ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="p-4 h-full"
            >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Good Morning.</h1>
                <h2 className="text-xl text-gray-600">Johnson</h2>
              </div>
              <Bell className="text-gray-600" size={24} />
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
                      onClick={() => {
                        if (date) {
                          setSelectedDate(date);
                          setShowDayView(true);
                        }
                      }}
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
              <h3 className="font-semibold mb-3">Today Meeting</h3>
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
        ) : (
          <DayView
            date={selectedDate}
            events={getDayEvents(selectedDate)}
            onClose={() => setShowDayView(false)}
            onAddEvent={() => {
              setNewEvent(prev => ({
                ...prev,
                date: selectedDate.toISOString().split('T')[0]
              }));
              setIsEditing(false);
              setShowEventForm(true);
            }}
            onEditEvent={(event) => {
              setNewEvent(event);
              setIsEditing(true);
              setShowEventForm(true);
            }}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
      </AnimatePresence>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 1
          }}
          className="bg-white rounded-t-3xl p-6 w-full max-w-lg mb-16" // Added mb-16 for navigation spacing
        >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
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
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto"> {/* Added scrollable container */}
            <form onSubmit={isEditing ? handleUpdateEvent : handleAddEvent} className="space-y-4">
              <input
                type="text"
                value={newEvent.title}
                onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="Event title"
              />

              <input
                type="date"
                value={newEvent.date}
                onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="time"
                value={newEvent.time}
                onChange={e => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="text"
                value={newEvent.location}
                onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="Location"
              />

              <select
                value={newEvent.type}
                onChange={e => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="meeting">Meeting</option>
                <option value="personal">Personal</option>
                <option value="important">Important</option>
              </select>

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
                  className="flex-1 p-3 border rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 p-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800"
                >
                  {isEditing ? 'Update' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    )}
  </div>
);
};


const DayView = ({ date, events, onClose, onAddEvent, onEditEvent, onDeleteEvent }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const formatAMPM = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const getEventsForHour = (hour) => {
    return events.filter(event => {
      if (!event.time) return false;
      const eventHour = parseInt(event.time.split(':')[0]);
      return eventHour === hour;
    });
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 bg-white z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-semibold">
            {date.toLocaleDateString('en-US', { 
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </h2>
          <button 
            onClick={onAddEvent}
            className="p-2 bg-blue-900 text-white rounded-full hover:bg-blue-800"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          
          return (
            <div key={hour} className="flex gap-4 mb-6">
              <div className="w-20 text-gray-500 text-sm pt-2">
                {formatAMPM(hour)}
              </div>
              
              <div className="flex-1">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-purple-100 rounded-xl p-4 mb-2"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-purple-900">{event.title}</h4>
                        <div className="text-sm text-purple-700">
                          {event.time} {event.location && `• ${event.location}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEditEvent(event)}
                          className="p-1.5 hover:bg-purple-200 rounded-full transition-colors"
                        >
                          <Edit2 size={16} className="text-purple-700" />
                        </button>
                        <button
                          onClick={() => onDeleteEvent(event.id)}
                          className="p-1.5 hover:bg-purple-200 rounded-full transition-colors"
                        >
                          <Trash2 size={16} className="text-purple-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {hourEvents.length === 0 && (
                  <div className="border-l-2 border-gray-200 h-12 ml-2" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-around">
        <button className="flex flex-col items-center text-gray-400">
          <CalendarIcon size={24} />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button className="flex flex-col items-center text-blue-900">
          <Calendar size={24} />
          <span className="text-xs mt-1">Schedule</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <Heart size={24} />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </motion.div>
  );
};

export default SharedCalendar;
