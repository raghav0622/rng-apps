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
  refreshSession: () => Promise<User | null>; // Returns the user for immediate use
};

const RNGAuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  setUser: () => {},
  isSyncing: true,
  refreshSession: async () => null,
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

  //@ts-expect-error yolo
  const { runAction: checkSession } = useRNGServerAction(checkSessionAction, {
    onSuccess: (data) => {
      if (data?.user) {
        setUser(data.user);
      }
    },
    onError: (err) => {
      if (err.includes('Too many attempts')) return;
      if (
        (err.includes('Session missing') || err.includes('revoked')) &&
        window.location.pathname !== '/login'
      ) {
        window.location.href = '/login?reason=session_revoked_remote';
      }
    },
  });

  const refreshSession = async (): Promise<User | null> => {
    const result = await checkSession();
    const updatedUser = result?.user || null;
    if (updatedUser) setUser(updatedUser);
    return updatedUser;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) setIsSyncing(false);
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
          }
        }
      }
      setIsSyncing(false);
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
        refreshSession,
      }}
    >
      {children}
    </RNGAuthContext.Provider>
  );
}
