import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';
import ProfileSetupPage from './components/ProfileSetupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import WelcomePage from './components/WelcomePage';
import SettingsPage from './components/profile/SettingsPage';  // if SettingsPage is in components/profile
import { DarkModeProvider } from './components/DarkModeContext';



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
    <DarkModeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900">
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

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
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
      </div>
    </DarkModeProvider>

  );
};

export default App;