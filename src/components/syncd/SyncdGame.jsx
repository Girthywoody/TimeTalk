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
  const { user, getPartnerProfile } = useAuth();

  useEffect(() => {
    const loadGame = async () => {
      const partner = await getPartnerProfile();
      if (!partner) return;

      const gameRef = doc(db, 'syncd_games', `${user.uid}_${partner.uid}`);
      const unsubscribe = onSnapshot(gameRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
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
      answers: {
        [user.uid]: answer
      },
      timestamp: new Date()
    }, { merge: true });

    setIsLocked(true);
    startCountdown();
  };

  const resetGame = async () => {
    const partner = await getPartnerProfile();
    if (!partner) return;

    const gameRef = doc(db, 'syncd_games', `${user.uid}_${partner.uid}`);
    await setDoc(gameRef, {
      answers: {},
      timestamp: new Date()
    });

    setSelectedAnswer(null);
    setCustomAnswer('');
    setIsLocked(false);
    setCountdown(null);
    setShowResult(false);
    setPartnerAnswer(null);
  };

  return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="w-96 bg-gray-900/40 backdrop-blur-xl border border-gray-700 rounded-xl">
          <div className="p-8">
            {!showResult ? (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold mb-6 text-center">{question || "What should we eat?"}</h2>
                
                <div className="space-y-4">
                  {!answer && (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => submitAnswer("Option 1")}
                        className="p-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                      >
                        Option 1
                      </button>
                      <button
                        onClick={() => submitAnswer("Option 2")}
                        className="p-4 rounded-lg bg-purple-500 text-white hover:bg-purple-600"
                      >
                        Option 2
                      </button>
                    </div>
                  )}

                  {answer && !partnerAnswer && (
                    <div className="text-center text-gray-600 dark:text-gray-400">
                      Waiting for partner's answer...
                    </div>
                  )}

                  {answer && partnerAnswer && (
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-4">Results:</h3>
                      <div className="space-y-2">
                        <p>Your answer: {answer}</p>
                        <p>Partner's answer: {partnerAnswer}</p>
                        <p className="font-bold mt-4">
                          {answer === partnerAnswer ? "You're in sync! 🎉" : "Not quite in sync 😅"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className={`
                    w-full h-12 mt-4 text-lg font-semibold
                    bg-gradient-to-r from-blue-500 to-purple-600
                    hover:from-blue-600 hover:to-purple-700
                    transition-all duration-300
                    rounded-xl shadow-lg shadow-purple-500/30
                    hover:shadow-purple-500/50
                    disabled:opacity-50 disabled:cursor-not-allowed
                    border border-purple-400/20
                    text-white
                  `}
                  onClick={handleLock}
                  disabled={!selectedAnswer || (selectedAnswer === 'other' && !customAnswer.trim()) || isLocked}
                >
                  Lock In Answer
                </button>
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
