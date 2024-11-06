import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

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
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Force token refresh after login
      await result.user.getIdToken(true);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Force token refresh after signup
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

  return {
    user,
    loading,
    hasProfile,
    login,
    signup,
    logout,
    auth
  };
};