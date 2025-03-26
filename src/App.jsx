import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';
import ProfileSetupPage from './components/ProfileSetupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import SettingsPage from './components/profile/SettingsPage';
import { DarkModeProvider } from './context/DarkModeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PartnerProfilePage from './components/profile/PartnerProfilePage';
import ChristmasList from './components/profile/ChristmasList';
import { SpotifyCallback } from './components/SpotifyCallback';
import SyncdGame from './components/syncd/SyncdGame';
import { requestNotificationPermission } from './firebase';




const App = () => {
  const { user, loading } = useAuth();
  useEffect(() => {
    // Check if the app is installed as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    if (user) {
      initializeNotifications();
    }
    
    if (!isPWA && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      // Show installation prompt for iOS users
      alert('To enable notifications, please add this app to your home screen by clicking the share button and selecting "Add to Home Screen".');
    }
  }, [user]); // Empty dependency array means this runs once when component mounts

  

  const initializeNotifications = async () => {
    // Check if the app is installed as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    
    if (isPWA && Notification.permission !== 'granted') {
      try {
        // Try to get permission on startup
        const permission = await Notification.requestPermission();
        console.log('Notification permission status:', permission);
        
        if (permission === 'granted') {
          // Get token if permission granted
          const token = await requestNotificationPermission();
          console.log('Notification token obtained:', token);
        }
      } catch (err) {
        console.error('Failed to initialize notifications:', err);
      }
    }
  };

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

          {/* Protected routes for main app */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <>
                  <MainApp />
                </>
              </ProtectedRoute>
            }
          />

          <Route path="/profile/:userId" element={<PartnerProfilePage />} />
          <Route path="/christmas-list" element={<ChristmasList />} />
          <Route path="/christmas-list/:userId" element={<ChristmasList />} />
          <Route path="/callback" element={<SpotifyCallback />} />
          <Route path="/syncd" element={<SyncdGame />} />
        </Routes>
        
        <ToastContainer
          position="bottom-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
        />
      </div>
    </DarkModeProvider>
  );
};

export default App;