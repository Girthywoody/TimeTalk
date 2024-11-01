import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';
import ProfileSetupPage from './components/ProfileSetupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import WelcomePage from './components/WelcomePage';
import SettingsPage from './profile/SettingsPage';


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
// In App.jsx, update the routes organization
<Routes>
  {/* Public route */}
  <Route 
    path="/login" 
    element={user ? <Navigate to="/" /> : <LoginPage />} 
  />

  {/* Protected routes */}
  <Route
    element={<ProtectedRoute />}
  >
    <Route path="/setup" element={<ProfileSetupPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route
      path="/*"
      element={
        <>
          <WelcomePage />
          <MainApp />
        </>
      }
    />
  </Route>
</Routes>
  );
};

export default App;