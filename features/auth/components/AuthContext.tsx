'use client';

import { clientAuth as auth } from '@/lib/firebase/client';
import { onIdTokenChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { SessionUser } from '../session';

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: SessionUser | null; // Receive server data
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  // CRITICAL: Initialize with server data to prevent "logged out" flash
  const [user, setUser] = useState<SessionUser | null>(initialUser);

  // If we have an initialUser, we are "optimistically" loaded.
  // We wait for Firebase only if we started with null (unknown state).
  const [loading, setLoading] = useState(!initialUser);
  const [isInitialized, setIsInitialized] = useState(!!initialUser);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const mappedUser: SessionUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };

        // Prevents unnecessary re-renders if data hasn't changed (Object Reference Stability)
        setUser((prev) => {
          if (
            prev &&
            prev.uid === mappedUser.uid &&
            prev.email === mappedUser.email &&
            prev.photoURL === mappedUser.photoURL &&
            prev.displayName === mappedUser.displayName
          ) {
            return prev;
          }
          return mappedUser;
        });
      } else {
        setUser(null);
      }
      setLoading(false);
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isInitialized }}>{children}</AuthContext.Provider>
  );
}
