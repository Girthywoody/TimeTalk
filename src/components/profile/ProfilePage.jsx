import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
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
      await result.user.getIdToken(true);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email, password) => {
    try {
      // First create the authentication user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      try {
        // Then try to create the user profile document
        await setDoc(doc(db, 'users', result.user.uid), {
          email: email,
          createdAt: new Date().toISOString(),
          displayName: email.split('@')[0], // Add a basic display name
          username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''), // Create a simple username
          stats: {
            messages: 0,
            moments: 0
          }
        });
      } catch (dbError) {
        console.error('Error creating user profile in database:', dbError);
        // We don't throw here because the authentication was successful
        // The profile can be created later
      }

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
      // Just return null for now since we're removing the partner requirement
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