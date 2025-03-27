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
    
    // REMOVED: initializeNotifications() call that was causing the error
    
    if (!isPWA && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      // Show installation prompt for iOS users
      alert('To enable notifications, please add this app to your home screen by clicking the share button and selecting "Add to Home Screen".');
    }
  }, [user]); // Empty dependency array means this runs once when component mounts

// Replace the multiple notification setups with a single consolidated one:
useEffect(() => {
  // Only initialize once when user is logged in
  if (!user) return;
  
  // Single function to handle all notification setup
  const setupNotifications = async () => {
    try {
      // Check if the app is installed as PWA
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true;
      
      // Set up handler for notification clicks
      if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'notificationClick') {
            const data = event.data.notification?.data;
            
            if (data) {
              if (data.type === 'message') {
                window.location.href = '/';
              } else if (data.type === 'nudge') {
                window.location.href = '/?nudged=true';
              }
            }
          }
        });
      }
      
      // Request permission if needed
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Notification permission status:', permission);
      }
      
      // Get token if permission granted
      if (Notification.permission === 'granted') {
        const token = await requestNotificationPermission();
        console.log('Notification token status:', token ? 'obtained' : 'failed');
      }
    } catch (err) {
      console.error('Failed to initialize notifications:', err);
    }
  };
  
  // Small delay to ensure everything is loaded
  const timer = setTimeout(setupNotifications, 2000);
  return () => clearTimeout(timer);
}, [user]);

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