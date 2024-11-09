import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Plus, Trash2, Gift, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMainApp } from '../../contexts/MainAppContext';

const ChristmasList = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const { setCurrentPage } = useMainApp();

  const isOwner = !userId || userId === user?.uid;

  useEffect(() => {
    const fetchList = async () => {
      try {
        const targetUserId = userId || user?.uid;
        const userRef = doc(db, 'users', targetUserId);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setItems(data.christmasList || []);
          setOwnerName(data.displayName || 'User');
        }
      } catch (error) {
        console.error('Error fetching Christmas list:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchList();
    }
  }, [user, userId]);

  const saveList = async (updatedItems) => {
    if (!user || !isOwner) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        christmasList: updatedItems
      });
    } catch (error) {
      console.error('Error saving Christmas list:', error);
    }
  };

  const addItem = async () => {
    if (!newItem.trim() || !isOwner) return;
    
    const updatedItems = [...items, {
      id: Date.now(),
      text: newItem.trim(),
      createdAt: new Date().toISOString()
    }];
    
    setItems(updatedItems);
    await saveList(updatedItems);
    setNewItem('');
  };

  const removeItem = async (itemId) => {
    if (!isOwner) return;
    
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    await saveList(updatedItems);
  };

  const handleBackClick = () => {
    navigate('/profile');
    setCurrentPage('profile');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image - Fixed file extension from .png to .pg */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-10"
        style={{ backgroundImage: 'url(/christmas-bg.jpg)' }}
      />

      {/* Content */}
      <div className="relative z-1">
        {/* Header */}
        <div className="border-b bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
            <button 
              onClick={handleBackClick}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Gift className="w-6 h-6 text-red-500" />
              {isOwner ? 'My Christmas List' : `${ownerName}'s Christmas List`}
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Add Item Form - Only show if user is owner */}
          {isOwner && (
            <div className="mb-8">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add an item to your list..."
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 
                    bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-900 dark:text-white 
                    focus:outline-none focus:ring-2 focus:ring-red-500"
                  onKeyPress={(e) => e.key === 'Enter' && addItem()}
                />
                <button
                  onClick={addItem}
                  className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 
                    transition-colors flex items-center gap-2 backdrop-blur-sm"
                >
                  <Plus className="w-5 h-5" />
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-white/90 dark:bg-gray-900/90 
                  backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-800"
              >
                <span className="text-gray-900 dark:text-white">{item.text}</span>
                {isOwner && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm 
                rounded-xl border border-gray-200 dark:border-gray-800 
                text-gray-500 dark:text-gray-400"
              >
                Your Christmas list is empty. Add some items!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChristmasList; 