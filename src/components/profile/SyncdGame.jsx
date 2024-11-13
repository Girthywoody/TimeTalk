import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, CircleDot, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
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
      try {
        const partnerProfile = await getPartnerProfile();
        if (!partnerProfile?.uid) {
          toast.error('Please connect with a partner first!');
          setLoading(false);
          return;
        }

        // Create a unique game ID using both user IDs (sorted to ensure consistency)
        const gameId = [user.uid, partnerProfile.uid].sort().join('_');
        const gameDoc = doc(db, 'syncdGames', gameId);

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
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up game:', error);
        toast.error('Error setting up game');
        setLoading(false);
      }
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

    try {
      const partnerProfile = await getPartnerProfile();
      if (!partnerProfile?.uid) {
        toast.error('Please connect with a partner first!');
        return;
      }

      setIsLocked(true);
      
      const gameId = [user.uid, partnerProfile.uid].sort().join('_');
      const gameDoc = doc(db, 'syncdGames', gameId);
      const answer = selectedAnswer === 'other' ? customAnswer : selectedAnswer;
      
      await setDoc(gameDoc, {
        [user.uid]: answer,
        timestamp: new Date().toISOString()
      }, { merge: true });

    } catch (error) {
      console.error('Error locking answer:', error);
      toast.error('Error saving your answer');
      setIsLocked(false);
    }
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
    try {
      const partnerProfile = await getPartnerProfile();
      if (!partnerProfile?.uid) {
        toast.error('Partner connection error');
        return;
      }

      const gameId = [user.uid, partnerProfile.uid].sort().join('_');
      const gameDoc = doc(db, 'syncdGames', gameId);
      await setDoc(gameDoc, {
        [user.uid]: null,
        [partnerProfile.uid]: null,
        timestamp: new Date().toISOString()
      });
      
      setSelectedAnswer(null);
      setCustomAnswer('');
      setIsLocked(false);
      setCountdown(null);
      setShowResult(false);
      setPartnerAnswer(null);

    } catch (error) {
      console.error('Error resetting game:', error);
      toast.error('Error resetting game');
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Card className="w-96 bg-gray-900/40 backdrop-blur-xl border border-gray-700">
          <CardContent className="p-8">
            {!showResult ? (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                  Choose Wisely
                </h2>
                
                <div className="grid grid-cols-3 gap-6">
                  {answers.map((answer) => (
                    <motion.div
                      key={answer.id}
                      whileHover={!isLocked ? { scale: 1.05 } : {}}
                      whileTap={!isLocked ? { scale: 0.95 } : {}}
                      className="perspective-1000"
                    >
                      <motion.button
                        className={`w-full group relative ${
                          !isLocked ? 'cursor-pointer' : 'cursor-default'
                        }`}
                        onClick={() => handleSelect(answer.id)}
                        disabled={isLocked}
                        whileHover={{ rotateY: 15 }}
                      >
                        <div
                          className={`
                            w-full h-20 rounded-xl 
                            ${selectedAnswer === answer.id 
                              ? `bg-gradient-to-br ${answer.gradient} shadow-lg ${answer.shadowColor}` 
                              : 'bg-gray-800 hover:bg-gray-700'
                            }
                            transition-all duration-300 ease-out
                            flex items-center justify-center
                            border border-gray-600/30
                            ${!isLocked ? answer.hoverGlow : ''}
                            hover:shadow-xl hover:-translate-y-1
                          `}
                        >
                          <motion.div
                            initial={false}
                            animate={{
                              scale: selectedAnswer === answer.id ? 1.2 : 1,
                              color: selectedAnswer === answer.id ? 'white' : 'gray'
                            }}
                            className="relative z-10"
                          >
                            {answer.icon}
                          </motion.div>
                        </div>
                      </motion.button>
                      <p className={`
                        text-center mt-3 font-medium capitalize
                        ${selectedAnswer === answer.id 
                          ? 'text-white' 
                          : 'text-gray-400'
                        }
                      `}>
                        {answer.id}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedAnswer === 'other' && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="relative"
                    >
                      <input
                        type="text"
                        placeholder="Type your answer..."
                        value={customAnswer}
                        onChange={(e) => setCustomAnswer(e.target.value)}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        disabled={isLocked}
                        className={`
                          w-full py-2 px-0
                          bg-transparent
                          text-white text-lg
                          placeholder-gray-500
                          border-b-2 
                          ${inputFocused 
                            ? 'border-purple-500' 
                            : 'border-gray-600'
                          }
                          focus:outline-none
                          transition-all duration-300
                          disabled:opacity-50
                          disabled:cursor-not-allowed
                        `}
                      />
                      <motion.div
                        className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-400 to-purple-500"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: inputFocused ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {countdown ? (
                  <motion.div
                    className="text-6xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text"
                    key={countdown}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    {countdown}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Button
                      className={`
                        w-full h-12 mt-4 text-lg font-semibold
                        bg-gradient-to-r from-blue-500 to-purple-600
                        hover:from-blue-600 hover:to-purple-700
                        transition-all duration-300
                        rounded-xl shadow-lg shadow-purple-500/30
                        hover:shadow-purple-500/50
                        disabled:opacity-50 disabled:cursor-not-allowed
                        border border-purple-400/20
                      `}
                      onClick={handleLock}
                      disabled={!selectedAnswer || (selectedAnswer === 'other' && !customAnswer.trim()) || isLocked}
                    >
                      {isLocked ? 'Waiting for partner...' : 'Lock In Answer'}
                    </Button>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div
                className="text-center space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                  {partnerAnswer === (selectedAnswer === 'other' ? customAnswer : selectedAnswer)
                    ? "You're in sync! 🎉"
                    : "Not quite in sync 😅"}
                </h2>
                <motion.div
                  className={`
                    p-6 rounded-xl
                    bg-gradient-to-br ${answers.find(a => a.id === selectedAnswer)?.gradient || 'from-blue-400 to-purple-500'}
                    shadow-lg ${answers.find(a => a.id === selectedAnswer)?.shadowColor || 'shadow-purple-500/50'}
                  `}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <div className="space-y-2">
                    <p className="text-white font-bold text-xl">
                      You chose: {selectedAnswer === 'other' ? customAnswer.toUpperCase() : selectedAnswer?.toUpperCase()}
                    </p>
                    <p className="text-white font-bold text-xl">
                      Partner chose: {partnerAnswer?.toUpperCase()}
                    </p>
                  </div>
                </motion.div>
                <Button
                  className="w-full h-12 bg-gradient-to-r from-gray-700 to-gray-600 
                             hover:from-gray-600 hover:to-gray-500 rounded-xl
                             shadow-lg shadow-gray-900/50 hover:shadow-gray-900/70
                             transition-all duration-300 text-lg font-semibold"
                  onClick={resetGame}
                >
                  Play Again
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default SyncdGame;