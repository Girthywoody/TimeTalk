import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, CircleDot } from 'lucide-react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import PageLayout from '../../layout/PageLayout';
import { toast } from 'react-toastify';

const SyncdGame = () => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [customAnswer, setCustomAnswer] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [partnerAnswer, setPartnerAnswer] = useState(null);
  const { user, getPartnerProfile } = useAuth();
  
  const answers = [
    { 
      id: 'yes', 
      icon: <Check size={24} />, 
      gradient: 'from-emerald-400 to-green-500',
      shadowColor: 'shadow-emerald-500/50',
      hoverGlow: 'hover:shadow-emerald-500/50'
    },
    { 
      id: 'no', 
      icon: <X size={24} />, 
      gradient: 'from-rose-400 to-red-500',
      shadowColor: 'shadow-rose-500/50',
      hoverGlow: 'hover:shadow-rose-500/50'
    },
    { 
      id: 'other', 
      icon: <CircleDot size={24} />, 
      gradient: 'from-violet-400 to-purple-500',
      shadowColor: 'shadow-violet-500/50',
      hoverGlow: 'hover:shadow-violet-500/50'
    }
  ];

  useEffect(() => {
    let unsubscribe;

    const setupGameListener = async () => {
      const partnerProfile = await getPartnerProfile();
      if (!partnerProfile?.uid) {
        toast.error('Please connect with a partner first!');
        return;
      }

      const gameDoc = doc(db, 'syncedGames', `${user.uid}_${partnerProfile.uid}`);
      unsubscribe = onSnapshot(gameDoc, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data[partnerProfile.uid]) {
            setPartnerAnswer(data[partnerProfile.uid]);
            if (data[user.uid] && !showResult) {
              startCountdown();
            }
          }
        }
      });
    };

    if (user) {
      setupGameListener();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleSelect = (answer) => {
    if (!isLocked) {
      setSelectedAnswer(answer);
      if (answer !== 'other') {
        setCustomAnswer('');
      }
    }
  };

  const handleLock = async () => {
    if (selectedAnswer === 'other' && !customAnswer.trim()) {
      return;
    }

    const partnerProfile = await getPartnerProfile();
    if (!partnerProfile?.uid) {
      toast.error('Please connect with a partner first!');
      return;
    }

    setIsLocked(true);
    
    const gameDoc = doc(db, 'syncedGames', `${user.uid}_${partnerProfile.uid}`);
    const answer = selectedAnswer === 'other' ? customAnswer : selectedAnswer;
    
    await setDoc(gameDoc, {
      [user.uid]: answer,
      timestamp: new Date().toISOString()
    }, { merge: true });
  };

  const startCountdown = () => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowResult(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetGame = async () => {
    const partnerProfile = await getPartnerProfile();
    if (partnerProfile?.uid) {
      const gameDoc = doc(db, 'syncedGames', `${user.uid}_${partnerProfile.uid}`);
      await setDoc(gameDoc, {
        [user.uid]: null,
        [partnerProfile.uid]: null,
        timestamp: new Date().toISOString()
      });
    }
    
    setSelectedAnswer(null);
    setCustomAnswer('');
    setIsLocked(false);
    setCountdown(null);
    setShowResult(false);
    setPartnerAnswer(null);
  };

  return (
    <PageLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sync'd</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Game Status */}
            <div className="text-center">
              {countdown && (
                <motion.div
                  key="countdown"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-bold text-gray-900 dark:text-white"
                >
                  {countdown}
                </motion.div>
              )}
              
              {showResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {partnerAnswer === selectedAnswer || 
                     (selectedAnswer === 'other' && partnerAnswer === customAnswer) ? (
                      "You're in sync! 🎉"
                    ) : (
                      "Not quite in sync 😅"
                    )}
                  </div>
                  <div className="flex justify-center gap-4">
                    <div className="text-gray-600 dark:text-gray-400">
                      You: {selectedAnswer === 'other' ? customAnswer : selectedAnswer}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Partner: {partnerAnswer}
                    </div>
                  </div>
                  <button
                    onClick={resetGame}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Play Again
                  </button>
                </motion.div>
              )}
            </div>

            {/* Answer Options */}
            {!showResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {answers.map((answer) => (
                    <motion.button
                      key={answer.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(answer.id)}
                      disabled={isLocked}
                      className={`p-4 rounded-xl bg-gradient-to-br ${answer.gradient}
                        ${selectedAnswer === answer.id ? 'ring-2 ring-white' : ''}
                        ${isLocked ? 'opacity-50 cursor-not-allowed' : answer.hoverGlow}
                        shadow-lg ${answer.shadowColor}`}
                    >
                      <div className="text-white">{answer.icon}</div>
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedAnswer === 'other' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <input
                        type="text"
                        value={customAnswer}
                        onChange={(e) => setCustomAnswer(e.target.value)}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        placeholder="Type your answer..."
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        disabled={isLocked}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleLock}
                  disabled={!selectedAnswer || isLocked || (selectedAnswer === 'other' && !customAnswer.trim())}
                  className={`w-full p-4 rounded-lg font-semibold
                    ${!isLocked && selectedAnswer
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                >
                  {isLocked ? 'Waiting for partner...' : 'Lock In Answer'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default SyncdGame;