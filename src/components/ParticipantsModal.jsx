import React, { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import useDarkMode from '../hooks/useDarkMode';
import useAuth from '../hooks/useAuth';

const ParticipantsModal = ({ isOpen, onClose, onSelect, selectedParticipants }) => {
  const { darkMode } = useDarkMode();
  const [users, setUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user && !selectedParticipants.some(p => p.id === user.uid)) {
      onSelect({
        id: user.uid,
        displayName: user.displayName || 'You'
      });
    }

    const fetchUsers = async () => {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(u => u.id !== user.uid);

      setUsers(usersList);
    };

    fetchUsers();
  }, [user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md m-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Add Participants
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            >
              <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
            </button>
          </div>

          <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-500 font-medium">
                  {user?.displayName?.[0] || 'Y'}
                </span>
              </div>
              <div className="flex-1">
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user?.displayName || 'You'} (Event Creator)
                </p>
              </div>
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 ${darkMode ? 'border-blue-400 bg-blue-400' : 'border-blue-500 bg-blue-500'} flex items-center justify-center`}>
                  <Check size={12} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {users.map(user => (
              <div
                key={user.id}
                onClick={() => onSelect(user)}
                className={`p-3 rounded-lg cursor-pointer transition-colors
                  ${darkMode 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-500 font-medium">
                      {user.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 
                      ${selectedParticipants.some(p => p.id === user.id)
                        ? darkMode 
                          ? 'border-blue-400 bg-blue-400' 
                          : 'border-blue-500 bg-blue-500'
                        : darkMode
                          ? 'border-gray-600'
                          : 'border-gray-300'
                      } flex items-center justify-center`}
                    >
                      {selectedParticipants.some(p => p.id === user.id) && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 
                transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsModal; 