import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';
import ProfileSetupPage from './components/ProfileSetupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import SettingsPage from './components/profile/SettingsPage';
import { DarkModeProvider } from './context/DarkModeContext';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showApp, setShowApp] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  // If user is logged in and showApp is true, show the main application
  if (user && showApp) {
    return (
      <Routes>
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          }
        />
      </Routes>
    );
  }

  // Show login page with success callback
  if (!user || !showApp) {
    return (
      <Routes>
        <Route 
          path="/login" 
          element={<LoginPage onLoginSuccess={() => setShowApp(true)} />} 
        />
        <Route 
          path="*" 
          element={<Navigate to="/login" replace />} 
        />
      </Routes>
    );
  }

  return null;
};

const App = () => {
  return (
    <DarkModeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <AppContent />
      </div>
    </DarkModeProvider>
  );
};

export default App;