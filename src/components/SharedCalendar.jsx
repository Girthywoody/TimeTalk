import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Heart, Lock, Trash2, Edit2, X } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const SharedCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    type: "general"
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events from Firebase
  useEffect(() => {
    console.log('Fetching events...');
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched events:', fetchedEvents);
      setEvents(fetchedEvents);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching events: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    try {
      const eventData = {
        ...newEvent,
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
      alert('Failed to add event. Please try again.');
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    try {
      const eventRef = doc(db, 'events', newEvent.id);
      const eventData = {
        ...newEvent,
        updatedAt: new Date().toISOString()
      };
      delete eventData.id; // Remove id before updating

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
      alert('Failed to update event. Please try again.');
    }
  };

  const handleDeleteEvent = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteDoc(doc(db, 'events', newEvent.id));
      
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
      console.error("Error deleting event: ", error);
      alert('Failed to delete event. Please try again.');
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

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setIsEditing(true);
    setNewEvent(event);
    setShowEventForm(true);
  };

  const handleDateClick = (date) => {
    if (!date) return;
    
    const formattedDate = date.toISOString().split('T')[0];
    setNewEvent(prev => ({
      ...prev,
      date: formattedDate
    }));
    setIsEditing(false);
    setShowEventForm(true);
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case "celebration":
        return "bg-rose-100 text-rose-800";
      case "trip":
        return "bg-blue-100 text-blue-800";
      case "date":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDayEvents = (date) => {
    if (!date) return [];
    const formattedDate = date.toISOString().split('T')[0];
    return events.filter(event => event.date === formattedDate);
  };

  return (
    <div className="space-y-4 pb-20"> {/* Added pb-20 for navigation bar space */}
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-none shadow-lg rounded-lg mx-2">
        <div className="p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-blue-500" size={24} />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Our Calendar
            </h1>
          </div>
          <Lock className="text-blue-500" size={20} />
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-none p-3 mx-2">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(currentDate.getMonth() - 1);
                setCurrentDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-base font-semibold">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(currentDate.getMonth() + 1);
                setCurrentDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            onClick={() => {
              setNewEvent(prev => ({
                ...prev,
                date: new Date().toISOString().split('T')[0]
              }));
              setIsEditing(false);
              setShowEventForm(true);
            }}
            className="bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-600 transition-colors text-sm"
          >
            <Plus size={16} />
            Add
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-gray-500 text-xs font-medium">
              {day.charAt(0)}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays().map((date, index) => {
            const dayEvents = date ? getDayEvents(date) : [];
            const isToday = date?.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={`min-h-[70px] p-1 rounded-lg border border-gray-100
                  ${date ? 'hover:bg-blue-50 cursor-pointer transition-colors' : 'bg-transparent border-transparent'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                {date && (
                  <>
                    <div className={`text-right text-xs mb-1 ${isToday ? 'font-bold text-blue-500' : ''}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`${getEventTypeColor(event.type)} text-[10px] p-0.5 rounded 
                            hover:scale-105 transition-transform cursor-pointer group relative truncate`}
                          onClick={(e) => handleEventClick(event, e)}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-gray-500 pl-0.5">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Form Modal - Keep the same but adjust padding for mobile */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {isEditing ? 'Edit Event' : 'Add New Event'}
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
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={isEditing ? handleUpdateEvent : handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Enter event title"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={e => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={newEvent.type}
                  onChange={e => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                >
                  <option value="general">General</option>
                  <option value="celebration">Celebration</option>
                  <option value="trip">Trip</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete Event
                  </button>
                )}
                <div className="flex gap-2">
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
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {isEditing ? 'Update Event' : 'Add Event'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedCalendar;