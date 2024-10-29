import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const SearchBar = ({ onMessageSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchMessages = async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const messagesRef = collection(db, 'messages');
        const q = query(
          messagesRef,
          where('text', '>=', searchTerm),
          where('text', '<=', searchTerm + '\uf8ff'),
          orderBy('text'),
          orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(q);
        const searchResults = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(searchMessages, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-lg transition-all duration-300 ${isOpen ? 'h-full' : 'h-0'}`}>
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-2">
          <SearchIcon size={20} className="text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 p-2 outline-none"
            autoFocus
          />
          <button 
            onClick={() => {
              setIsOpen(false);
              setSearchTerm('');
              setResults([]);
            }}
            className="p-2"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : results.length > 0 ? (
          <div className="mt-4 space-y-2">
            {results.map(message => (
              <button
                key={message.id}
                onClick={() => {
                  onMessageSelect(message);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div className="text-sm text-gray-600">
                  {message.timestamp?.toLocaleString()}
                </div>
                <div className="mt-1">
                  {message.text}
                </div>
              </button>
            ))}
          </div>
        ) : searchTerm && (
          <div className="p-4 text-center text-gray-500">
            No messages found
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;