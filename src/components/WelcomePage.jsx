import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Gift, Bell, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const WelcomePage = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDismiss = () => {
    setShowWelcome(false);
    navigate('/');
  };

  if (!showWelcome) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-fade-in">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Heart className="text-rose-500" size={48} />
          </div>

          <h1 className="text-3xl font-bold text-gray-800">
            Welcome to Love Capsule!
          </h1>

          <p className="text-gray-600">
            Hi {user?.displayName || 'there'}! We're excited to have you here.
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <Gift className="text-purple-500 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">Share Memories</h3>
                <p className="text-gray-600 text-sm">Create and share special moments with your loved one.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Bell className="text-blue-500 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">Stay Connected</h3>
                <p className="text-gray-600 text-sm">Get notifications about important moments and updates.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl
                    flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-200"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;