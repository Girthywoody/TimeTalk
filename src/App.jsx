import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';
import ProfileSetupPage from './components/ProfileSetupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import WelcomePage from './components/WelcomePage';

const App = () => {
  const { user, loading } = useAuth();


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public route */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" /> : <LoginPage />} 
      />

      {/* Protected route for profile setup */}
      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <ProfileSetupPage />
          </ProtectedRoute>
        }
      />

      {/* Protected routes for main app */}
      <Route
          path="/*"
          element={
            <ProtectedRoute>
              <>
                <WelcomePage />
                <MainApp />
              </>
            </ProtectedRoute>
          }
        />
      </Routes>
  );
};

export default App;