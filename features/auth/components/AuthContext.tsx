// features/auth/components/AuthContext.tsx
'use client';

import { clientAuth as auth } from '@/lib/firebase/client';
import { onIdTokenChanged } from 'firebase/auth';
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

  const updateUser = (updates: Partial<SessionUser>) => {
    setUser((prev) => {
      if (!prev) return null;

      // CRITICAL FIX: We must allow 'null' to override the previous value.
      // We only want to fallback to prev if the update is explicitly 'undefined'.
      return {
        ...prev,
        ...updates,
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
