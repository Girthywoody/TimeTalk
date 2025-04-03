import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);

      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          setHasProfile(userDoc.exists());
        } catch (error) {
          console.error('Error checking profile:', error);
          setHasProfile(false);
        }
      }
      setProfileChecked(true);
    });

    return unsubscribe;
  }, []);

  if (!authChecked || !profileChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasProfile && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  return children;
};

export default ProtectedRoute;