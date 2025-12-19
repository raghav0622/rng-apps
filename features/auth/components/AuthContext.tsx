'use client';

import { clientAuth as auth } from '@/lib/firebase/client';
import { User as FirebaseUser, onIdTokenChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { SessionUser } from '../session';

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  isInitialized: boolean;
  updateUser: (updates: Partial<SessionUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: SessionUser | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [loading, setLoading] = useState<boolean>(!initialUser);
  const [isInitialized, setIsInitialized] = useState<boolean>(!!initialUser);

  // Helper to map Firebase User to our SessionUser shape
  const mapUser = (fbUser: FirebaseUser): SessionUser => ({
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    photoURL: fbUser.photoURL,
  });

  useEffect(() => {
    // onIdTokenChanged triggers on login, logout, AND token refreshes (every hour)
    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const mapped = mapUser(firebaseUser);

        // Deep comparison to prevent re-renders loops
        setUser((prev) => {
          if (
            prev &&
            prev.uid === mapped.uid &&
            prev.email === mapped.email &&
            prev.photoURL === mapped.photoURL &&
            prev.displayName === mapped.displayName
          ) {
            return prev;
          }
          return mapped;
        });
      } else {
        setUser(null);
      }

      setLoading(false);
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const updateUser = (updates: Partial<SessionUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates,
        // Ensure explicit undefined checks to allow nulls
        displayName: updates.displayName === undefined ? prev.displayName : updates.displayName,
        photoURL: updates.photoURL === undefined ? prev.photoURL : updates.photoURL,
      };
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, isInitialized, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
