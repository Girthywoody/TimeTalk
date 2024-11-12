import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import PageLayout from '../../layout/PageLayout';

const SyncdGame = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [partnerAnswer, setPartnerAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, getPartnerProfile } = useAuth();

  useEffect(() => {
    const loadGame = async () => {
      const partner = await getPartnerProfile();
      if (!partner) return;

      // Subscribe to real-time updates for the current game
      const gameRef = doc(db, 'syncd_games', `${user.uid}_${partner.uid}`);
      const unsubscribe = onSnapshot(gameRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setQuestion(data.question);
          if (data.answers?.[user.uid]) setAnswer(data.answers[user.uid]);
          if (data.answers?.[partner.uid]) setPartnerAnswer(data.answers[partner.uid]);
        }
      });

      setLoading(false);
      return unsubscribe;
    };

    loadGame();
  }, [user]);

  const submitAnswer = async (selectedAnswer) => {
    const partner = await getPartnerProfile();
    if (!partner) return;

    const gameRef = doc(db, 'syncd_games', `${user.uid}_${partner.uid}`);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      // Start new game
      await setDoc(gameRef, {
        question: "What should we eat?", // You can randomize this from a list
        answers: {
          [user.uid]: selectedAnswer
        },
        timestamp: new Date()
      });
    } else {
      // Update existing game
      const currentGame = gameDoc.data();
      await setDoc(gameRef, {
        ...currentGame,
        answers: {
          ...currentGame.answers,
          [user.uid]: selectedAnswer
        }
      }, { merge: true });
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
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
        </div>
      </div>
    </PageLayout>
  );
};

export default SyncdGame;
