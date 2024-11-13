import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, setDoc, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import DecisionGame from './DecisionGame';

const SyncdGame = () => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState(null);
  const [partnerAnswer, setPartnerAnswer] = useState(null);
  const [partnerId, setPartnerId] = useState(null);

  // Fetch partner ID on mount
  useEffect(() => {
    const fetchPartnerId = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().partnerId) {
        setPartnerId(userDoc.data().partnerId);
      }
    };
    fetchPartnerId();
  }, [user.uid]);

  // Listen for game state changes
  useEffect(() => {
    if (!partnerId) return;

    const gameRef = doc(db, 'syncdGames', `${user.uid}_${partnerId}`);
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGameState(data);
        
        // Check if partner has answered
        if (data[partnerId]) {
          setPartnerAnswer(data[partnerId]);
        }
      }
    });

    return () => unsubscribe();
  }, [user.uid, partnerId]);

  const handleAnswer = async (answer, customAnswer = '') => {
    if (!partnerId) {
      toast.error('No partner found! Please make sure you have a partner linked to your account.');
      return;
    }

    const gameRef = doc(db, 'syncdGames', `${user.uid}_${partnerId}`);
    const gameDoc = await getDoc(gameRef);
    
    const myAnswer = {
      answer,
      customAnswer,
      timestamp: new Date().toISOString()
    };

    if (!gameDoc.exists()) {
      // Create new game
      await setDoc(gameRef, {
        [user.uid]: myAnswer
      });
    } else {
      // Update existing game
      await setDoc(gameRef, {
        [user.uid]: myAnswer
      }, { merge: true });
    }
  };

  const handleReset = async () => {
    if (!partnerId) return;
    
    const gameRef = doc(db, 'syncdGames', `${user.uid}_${partnerId}`);
    await deleteDoc(gameRef);
    setGameState(null);
    setPartnerAnswer(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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