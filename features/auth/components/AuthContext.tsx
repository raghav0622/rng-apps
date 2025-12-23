'use client';

import { checkSessionAction, syncUserAction } from '@/features/auth/actions/session.actions';
import { User } from '@/features/auth/auth.model';
import { clientAuth } from '@/lib/firebase/client';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { User as FirebaseUser, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  isSyncing: boolean;
  refreshSession: () => Promise<void>;
};

const RNGAuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  setUser: () => {},
  isSyncing: true,
  refreshSession: async () => {},
});

export const useRNGAuth = () => useContext(RNGAuthContext);

export function RNGAuthContextProvider({
  children,
  user: serverUser,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  const [user, setUser] = useState<User | null>(serverUser);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  // --- 1. Session Heartbeat (Optimized) ---
  const { execute: checkSession } = useRNGServerAction(checkSessionAction, {
    onSuccess: (data) => {
      // FIX: 'data' is now correctly typed as { user: User }
      if (data?.user) {
        setUser(data.user);
      }
    },
    onError: (err) => {
      // Ignore Rate Limit errors to prevent logout loops
      if (err.includes('Too many attempts')) {
        console.warn('Session heartbeat rate limited - ignoring.');
        return;
      }

      if (err.includes('Session missing') || err.includes('revoked')) {
        window.location.href = '/login?reason=session_revoked_remote';
      }
    },
  });

  // Poll infrequently (every 2 minutes) + on Window Focus
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    }, 120000); // 2 minutes

    const onFocus = () => {
      checkSession();
    };

    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user, checkSession]);

  // --- 2. Client SDK Sync (Unchanged) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        setIsSyncing(false);
      }
    });

    const handleSync = async () => {
      if (serverUser && !clientAuth.currentUser) {
        setIsSyncing(true);
        const result = await syncUserAction();

        if (result?.data?.success && result.data.data) {
          try {
            await signInWithCustomToken(clientAuth, result.data.data as string);
          } catch (error) {
            console.error('Client Auto-Login Failed:', error);
            setIsSyncing(false);
          }
        } else {
          setIsSyncing(false);
        }
      } else {
        setIsSyncing(false);
      }
    };

    handleSync();

    return () => unsubscribe();
  }, [serverUser]);

  return (
    <RNGAuthContext.Provider
      value={{
        user,
        firebaseUser,
        setUser,
        isSyncing,
        refreshSession: async () => {
          await checkSession();
        },
      }}
    >
      {children}
    </RNGAuthContext.Provider>
  );
}
