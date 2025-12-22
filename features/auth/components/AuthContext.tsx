'use client';

import { clientAuth } from '@/lib/firebase/client';
import { User as FirebaseUser, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { syncUserAction } from '../auth.actions'; // Import the new action
import { UserInSession } from '../auth.model';

type AuthContextType = {
  /** Server-side User (from Cookie). Source of Truth for App Logic/Routing */
  user: UserInSession | null;
  /** Client-side User (from SDK). Source of Truth for Firestore/Storage access */
  firebaseUser: FirebaseUser | null;
  setUser: Dispatch<SetStateAction<UserInSession | null>>;
  /** True while the client SDK is attempting to sync with the server session */
  isSyncing: boolean;
};

const RNGAuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  setUser: () => {},
  isSyncing: true,
});

export const useRNGAuth = () => useContext(RNGAuthContext);

export function RNGAuthContextProvider({
  children,
  user: serverUser,
}: {
  children: React.ReactNode;
  user: UserInSession | null;
}) {
  const [user, setUser] = useState<UserInSession | null>(serverUser);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  // 1. Sync Server User Prop to State
  useEffect(() => {
    setUser(serverUser);
  }, [serverUser]);

  // 2. Client SDK Synchronization Logic
  useEffect(() => {
    // Listener for SDK state changes
    const unsubscribe = onAuthStateChanged(clientAuth, (currentUser) => {
      setFirebaseUser(currentUser);

      // If we have a user, we aren't "syncing" anymore in terms of initial load
      if (currentUser) {
        setIsSyncing(false);
      }
    });

    const handleSync = async () => {
      // SCENARIO: Server says Logged In, but Client SDK says Logged Out
      if (serverUser && !clientAuth.currentUser) {
        setIsSyncing(true);
        const result = await syncUserAction();

        if (result?.data?.success && result.data.data) {
          const customToken = result.data.data;
          try {
            await signInWithCustomToken(clientAuth, customToken);
            // 'onAuthStateChanged' will trigger and set firebaseUser + isSyncing(false)
          } catch (error) {
            console.error('Client Auto-Login Failed:', error);
            setIsSyncing(false);
          }
        } else {
          setIsSyncing(false);
        }
      } else {
        // SCENARIO: Not logged in on server, or already logged in on client
        setIsSyncing(false);
      }
    };

    handleSync();

    return () => unsubscribe();
  }, [serverUser]);

  return (
    <RNGAuthContext.Provider value={{ user, firebaseUser, setUser, isSyncing }}>
      {children}
    </RNGAuthContext.Provider>
  );
}
