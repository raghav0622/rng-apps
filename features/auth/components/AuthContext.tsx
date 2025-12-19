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
  initialUser?: SessionUser | null; // <--- ADD THIS
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  // Initialize state with the Server-Side user (if available)
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [isInitialized, setIsInitialized] = useState(!!initialUser);

  useEffect(() => {
    // Listen for Client-Side Token Updates (e.g. invalidation, token refresh)
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Client SDK is signed in
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        // Client SDK is not signed in.
        // If we had an initialUser (SSR), we generally trust it until
        // an explicit logout action clears the server cookie.
        // However, if the client SDK explicitly says "nobody is home" AND
        // we are sure it's not just initializing, we might sync state.
        // For session-cookie based apps, we often rely on the SSR state mostly.
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
