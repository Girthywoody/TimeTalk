import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, CircleDot } from 'lucide-react';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import PageLayout from '../../layout/PageLayout';

const SyncdGame = () => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [customAnswer, setCustomAnswer] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [partnerAnswer, setPartnerAnswer] = useState(null);
  const [question, setQuestion] = useState("Should we eat takeout?"); // Default question
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
    const loadGame = async () => {
      const partner = await getPartnerProfile();
      if (!partner) return;

      const gameRef = doc(db, 'syncd_games', `${user.uid}_${partner.uid}`);
      const unsubscribe = onSnapshot(gameRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.question) setQuestion(data.question);
          if (data.answers?.[partner.uid]) {
            setPartnerAnswer(data.answers[partner.uid]);
            if (isLocked) setShowResult(true);
          }
        }
      });

      return unsubscribe;
    };

    loadGame();
  }, [user, isLocked]);

  const handleLock = async () => {
    if (selectedAnswer === 'other' && !customAnswer.trim()) {
      return;
    }

    const partner = await getPartnerProfile();
    if (!partner) return;

    const gameRef = doc(db, 'syncd_games', `${user.uid}_${partner.uid}`);
    const answer = selectedAnswer === 'other' ? customAnswer : selectedAnswer;

    await setDoc(gameRef, {
      question,
      answers: {
        [user.uid]: answer
      },
      timestamp: new Date()
    }, { merge: true });

    setIsLocked(true);
    startCountdown();
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
    const partner = await getPartnerProfile();
    if (!partner) return;

    const gameRef = doc(db, 'syncd_games', `${user.uid}_${partner.uid}`);
    await setDoc(gameRef, {
      question: "",
      answers: {},
      timestamp: new Date()
    });

    setSelectedAnswer(null);
    setCustomAnswer('');
    setIsLocked(false);
    setCountdown(null);
    setShowResult(false);
    setPartnerAnswer(null);
    setQuestion("Should we eat takeout?"); // Reset to default question
  };

  return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="w-96 bg-gray-900/40 backdrop-blur-xl border border-gray-700 rounded-xl">
          <div className="p-8">
            {!showResult ? (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                  {question}
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
                        onClick={() => !isLocked && setSelectedAnswer(answer.id)}
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
                          {answer.icon}
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
                          w-full py-2 px-4
                          bg-gray-800
                          text-white text-lg
                          placeholder-gray-500
                          rounded-xl
                          border-2
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
                  >
                    {countdown}
                  </motion.div>
                ) : (
                  <button
                    className={`
                      w-full h-12 text-lg font-semibold
                      bg-gradient-to-r from-blue-500 to-purple-600
                      hover:from-blue-600 hover:to-purple-700
                      text-white
                      transition-all duration-300
                      rounded-xl shadow-lg shadow-purple-500/30
                      hover:shadow-purple-500/50
                      disabled:opacity-50 disabled:cursor-not-allowed
                      border border-purple-400/20
                    `}
                    onClick={handleLock}
                    disabled={!selectedAnswer || (selectedAnswer === 'other' && !customAnswer.trim()) || isLocked}
                  >
                    Lock In Answer
                  </button>
                )}
              </div>
            ) : (
              <motion.div
                className="text-center space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                  Results
                </h2>
                <div className="space-y-4">
                  <motion.div
                    className={`
                      p-6 rounded-xl
                      bg-gradient-to-br ${answers.find(a => a.id === selectedAnswer)?.gradient || 'from-purple-400 to-pink-600'}
                      shadow-lg ${answers.find(a => a.id === selectedAnswer)?.shadowColor || 'shadow-purple-500/50'}
                    `}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    <p className="text-white font-bold text-xl">
                      You chose: {selectedAnswer === 'other' ? customAnswer.toUpperCase() : selectedAnswer?.toUpperCase()}
                    </p>
                  </motion.div>

                  {partnerAnswer && (
                    <motion.div
                      className="p-6 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/50"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    >
                      <p className="text-white font-bold text-xl">
                        Partner chose: {partnerAnswer.toUpperCase()}
                      </p>
                    </motion.div>
                  )}
                </div>
                
                <button
                  className="w-full h-12 bg-gradient-to-r from-gray-700 to-gray-600 
                           hover:from-gray-600 hover:to-gray-500 rounded-xl
                           shadow-lg shadow-gray-900/50 hover:shadow-gray-900/70
                           transition-all duration-300 text-lg font-semibold
                           text-white"
                  onClick={resetGame}
                >
                  Play Again
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default SyncdGame;
