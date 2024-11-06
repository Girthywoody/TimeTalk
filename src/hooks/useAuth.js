import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isAllowedEmail, ALLOWED_USERS } from '../firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Force token refresh on each auth state change
          await currentUser.getIdToken(true);
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          setHasProfile(userDoc.exists());
        } catch (error) {
          console.error('Error checking profile:', error);
          setHasProfile(false);
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setHasProfile(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      // Check if email is allowed
      if (!isAllowedEmail(email)) {
        throw new Error('This app is restricted to specific users only.');
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      await result.user.getIdToken(true);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email, password) => {
    try {
      // Check if email is allowed
      if (!isAllowedEmail(email)) {
        throw new Error('This app is restricted to specific users only.');
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Get partner info based on email
      const partnerConfig = Object.values(ALLOWED_USERS).find(user => 
        user.email !== email
      );

      // Create initial user profile with partner link
      await setDoc(doc(db, 'users', result.user.uid), {
        email: email,
        createdAt: new Date().toISOString(),
        partnerId: partnerConfig?.partnerId || null,
        // Add any other initial profile fields
      });

      await result.user.getIdToken(true);
      return result;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear any cached data before signing out
      await auth.currentUser?.getIdToken(true);
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Add this function to get partner's profile
  const getPartnerProfile = async () => {
    if (!user) return null;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (userData?.partnerId) {
        const partnerDoc = await getDoc(doc(db, 'users', userData.partnerId));
        if (partnerDoc.exists()) {
          return {
            ...partnerDoc.data(),
            uid: userData.partnerId
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting partner profile:', error);
      return null;
    }
  };

  return {
    user,
    loading,
    hasProfile,
    login,
    signup,
    logout,
    getPartnerProfile,
    auth
  };
};