import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const CustomDateTimeSelector = ({ selectedDateTime, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('date');
  
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  minDate.setHours(0, 0, 0, 0);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const [displayDate, setDisplayDate] = useState(() => {
    return selectedDateTime || new Date(minDate.getTime());
  });

  // Preset date options
  const presetOptions = [
    { label: '1 Month', days: 30 },
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '1 Year', days: 365 }
  ];

  const handlePresetSelect = (days) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    // Set to 8 AM by default for presets
    newDate.setHours(8, 0, 0, 0);
    onChange(newDate);
    setIsOpen(false);
  };

  const generateCalendarDays = () => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    
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

  const handleDateSelect = (date) => {
    if (date < minDate) return;
    
    const newDateTime = new Date(selectedDateTime || new Date());
    newDateTime.setFullYear(date.getFullYear());
    newDateTime.setMonth(date.getMonth());
    newDateTime.setDate(date.getDate());
    
    onChange(newDateTime);
    setView('time');
  };

  const generateTimeSlots = () => {
    const slots = [];
    // Start from 8 AM
    for (let hour = 8; hour < 32; hour++) {
      const displayHour = hour % 24;
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push({ hour: displayHour, minute });
      }
    }
    return slots;
  };

  const handleTimeSelect = (hours, minutes) => {
    const newDateTime = new Date(selectedDateTime || displayDate);
    newDateTime.setHours(hours);
    newDateTime.setMinutes(minutes);
    
    onChange(newDateTime);
    setIsOpen(false);
  };

  const changeMonth = (delta) => {
    const newDate = new Date(displayDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setDisplayDate(newDate);
  };

  const formatTime = (hours, minutes) => {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="relative isolate">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
      >
        {selectedDateTime ? (
          <>
            <CalendarIcon size={20} className="text-blue-500" />
            <span className="text-gray-700">
              {selectedDateTime.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </>
        ) : (
          <>
            <CalendarIcon size={20} className="text-gray-400" />
            <span className="text-gray-400">Schedule for future</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl p-4 w-[340px] z-[100]">
          {/* Preset Options */}
          <div className="mb-4 p-2 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-2">
              <Calendar size={14} />
              Quick Select
            </div>
            <div className="grid grid-cols-2 gap-2">
              {presetOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handlePresetSelect(option.days)}
                  className="px-3 py-2 text-sm rounded-md bg-white hover:bg-blue-100 
                           text-blue-600 hover:text-blue-700 transition-colors
                           border border-blue-200 hover:border-blue-300"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setView('date')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                ${view === 'date' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <CalendarIcon size={16} />
              <span>Date</span>
            </button>
            <button
              onClick={() => setView('time')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                ${view === 'time' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <Clock size={16} />
              <span>Time</span>
            </button>
          </div>

          {view === 'date' ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="font-medium">
                  {months[displayDate.getMonth()]} {displayDate.getFullYear()}
                </span>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-xs font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((date, index) => (
                  <button
                    key={index}
                    onClick={() => date && handleDateSelect(date)}
                    disabled={date && date < minDate}
                    className={`
                      p-2 rounded-lg text-sm
                      ${!date ? 'invisible' : ''}
                      ${date && date < minDate ? 'text-gray-300 cursor-not-allowed' : ''}
                      ${date && date >= minDate ? 'hover:bg-blue-50 cursor-pointer' : ''}
                      ${selectedDateTime && date && date.toDateString() === selectedDateTime.toDateString()
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : ''}
                    `}
                  >
                    {date?.getDate()}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {generateTimeSlots().map(({ hour, minute }, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSelect(hour, minute)}
                  className={`
                    p-2 text-sm rounded-lg transition-colors
                    ${selectedDateTime &&
                      selectedDateTime.getHours() === hour &&
                      selectedDateTime.getMinutes() === minute
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-blue-50'}
                  `}
                >
                  {formatTime(hour, minute)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomDateTimeSelector;