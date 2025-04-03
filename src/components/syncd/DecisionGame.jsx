import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, CircleDot } from 'lucide-react';

const DecisionGame = ({ onAnswer, onReset, gameState, partnerAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [customAnswer, setCustomAnswer] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  useEffect(() => {
    if (isLocked && gameState && Object.keys(gameState).length === 2) {
      startCountdown();
    }
  }, [gameState, isLocked]);

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

  const handleSelect = (answer) => {
    if (!isLocked) {
      setSelectedAnswer(answer);
      if (answer !== 'other') {
        setCustomAnswer('');
      }
    }
  };

  const handleLock = () => {
    if (selectedAnswer === 'other' && !customAnswer.trim()) {
      return;
    }
    setIsLocked(true);
    onAnswer(selectedAnswer, customAnswer);
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

  const resetGame = () => {
    setSelectedAnswer(null);
    setCustomAnswer('');
    setIsLocked(false);
    setCountdown(null);
    setShowResult(false);
  };

  const renderResults = () => (
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
          className={`p-6 rounded-xl bg-gradient-to-br ${answers.find(a => a.id === selectedAnswer).gradient}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <p className="text-white font-bold text-xl">
            You chose: {selectedAnswer === 'other' ? customAnswer.toUpperCase() : selectedAnswer.toUpperCase()}
          </p>
        </motion.div>
        
        {partnerAnswer && (
          <motion.div
            className={`p-6 rounded-xl bg-gradient-to-br ${answers.find(a => a.id === partnerAnswer.answer).gradient}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <p className="text-white font-bold text-xl">
              Partner chose: {partnerAnswer.answer === 'other' ? partnerAnswer.customAnswer.toUpperCase() : partnerAnswer.answer.toUpperCase()}
            </p>
          </motion.div>
        )}
      </div>
      
      <button
        className="w-full h-12 bg-gradient-to-r from-gray-700 to-gray-600"
        onClick={() => {
          resetGame();
          onReset();
        }}
      >
        Play Again
      </button>
    </motion.div>
  );

  const renderWaitingMessage = () => (
    <motion.div
      className="text-xl font-semibold text-center text-purple-400"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      Waiting for partner...
    </motion.div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-96 bg-gray-900/40 backdrop-blur-xl border border-gray-700 rounded-xl">
        <div className="p-8">
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <input
                      type="text"
                      placeholder="Enter your custom answer..."
                      value={customAnswer}
                      onChange={(e) => setCustomAnswer(e.target.value)}
                      className="w-full h-12 bg-gray-800 border-gray-700 text-white
                               placeholder-gray-400 rounded-xl focus:ring-purple-500
                               focus:border-purple-500 transition-all duration-300"
                      disabled={isLocked}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {isLocked && !countdown ? renderWaitingMessage() : countdown ? (
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
                  <button
                    className={`
                      w-full h-12 mt-4 text-lg font-semibold text-white
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
                    Lock In Answer
                  </button>
                </motion.div>
              )}
            </div>
          ) : renderResults()}
        </div>
      </div>
    </div>
  );
};

export default DecisionGame;