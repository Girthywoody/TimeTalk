import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, setDoc, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Loader2, ArrowLeft } from 'lucide-react';
import DecisionGame from './DecisionGame';
import { useNavigate } from 'react-router-dom';

const SyncdGame = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [partnerAnswer, setPartnerAnswer] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch partner ID on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPartnerId = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().partnerId) {
          setPartnerId(userDoc.data().partnerId);
        }
      } catch (error) {
        console.error('Error fetching partner:', error);
        toast.error('Failed to load partner information');
      } finally {
        setLoading(false);
      }
    };
    fetchPartnerId();
  }, [user]);

  // Listen for game state changes
  useEffect(() => {
    if (!user || !partnerId) return;

    const gameRef = doc(db, 'syncdGames', `${user.uid}_${partnerId}`);
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGameState(data);
        
        if (data[partnerId]) {
          setPartnerAnswer(data[partnerId]);
        }
      }
    });

    return () => unsubscribe();
  }, [user, partnerId]);

  const handleAnswer = async (answer, customAnswer = '') => {
    if (!partnerId) {
      toast.error('No partner found! Please make sure you have a partner linked to your account.');
      return;
    }

    try {
      const gameRef = doc(db, 'syncdGames', `${user.uid}_${partnerId}`);
      const gameDoc = await getDoc(gameRef);
      
      const myAnswer = {
        answer,
        customAnswer,
        timestamp: new Date().toISOString()
      };

      if (!gameDoc.exists()) {
        await setDoc(gameRef, {
          [user.uid]: myAnswer
        });
      } else {
        await setDoc(gameRef, {
          [user.uid]: myAnswer
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer. Please try again.');
    }
  };

  const handleReset = async () => {
    if (!partnerId) return;
    
    const gameRef = doc(db, 'syncdGames', `${user.uid}_${partnerId}`);
    await deleteDoc(gameRef);
    setGameState(null);
    setPartnerAnswer(null);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-purple-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <button
        onClick={() => navigate('/profile')}
        className="absolute top-4 left-4 p-2 rounded-full bg-gray-900/40 
                   hover:bg-gray-800/60 transition-colors duration-200
                   border border-gray-700/50 backdrop-blur-sm"
      >
        <ArrowLeft className="w-6 h-6 text-gray-300" />
      </button>
      
      <DecisionGame 
        onAnswer={handleAnswer}
        onReset={handleReset}
        gameState={gameState}
        partnerAnswer={partnerAnswer}
      />
    </div>
  );
};

export default SyncdGame; 