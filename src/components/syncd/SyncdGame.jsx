import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../config/firebase';
import { doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { DecisionGame } from './DecisionGame';

const SyncdGame = () => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState(null);
  const [partnerAnswer, setPartnerAnswer] = useState(null);
  
  useEffect(() => {
    // Subscribe to the game state
    const gameRef = doc(db, 'syncdGames', user.uid);
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        setGameState(doc.data());
      }
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleAnswer = async (answer, customAnswer = '') => {
    const gameRef = doc(db, 'syncdGames', user.uid);
    await setDoc(gameRef, {
      userId: user.uid,
      answer: answer,
      customAnswer: customAnswer,
      timestamp: new Date().toISOString()
    }, { merge: true });
  };

  const handleReset = async () => {
    const gameRef = doc(db, 'syncdGames', user.uid);
    await deleteDoc(gameRef);
    setGameState(null);
    setPartnerAnswer(null);
  };

  return (
    <DecisionGame 
      onAnswer={handleAnswer}
      onReset={handleReset}
      gameState={gameState}
      partnerAnswer={partnerAnswer}
    />
  );
};

export default SyncdGame; 