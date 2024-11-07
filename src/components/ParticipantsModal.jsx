import React, { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

const ParticipantsModal = ({ isOpen, onClose, onSelect, selectedParticipants }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const userData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const currentUser = userData.find(user => user.id === auth.currentUser.uid);
        if (currentUser && !selectedParticipants.some(p => p.id === currentUser.id)) {
          onSelect(currentUser);
        }
        
        setUsers(userData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSelected = (userId) => {
    return selectedParticipants.some(p => p.id === userId) || userId === auth.currentUser.uid;
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold dark:text-white">Add Participants</h3>
          <button onClick={onClose}>
            <X className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 
                text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => user.id !== auth.currentUser.uid && onSelect(user)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  isSelected(user.id)
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${user.id === auth.currentUser.uid ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <img
                  src={user.profilePhotoURL || "/default-avatar.png"}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 text-left">
                  <p className={`font-medium ${isSelected(user.id) ? 'text-blue-500' : 'dark:text-white'}`}>
                    {user.displayName}
                    {user.id === auth.currentUser.uid && " (You)"}
                  </p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
                {isSelected(user.id) && <Check size={20} />}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white 
                transition-colors font-medium"
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