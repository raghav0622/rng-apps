'use client';

import {
  checkSessionAction,
  logoutAction,
  syncUserAction,
} from '@/features/auth/actions/session.actions';
import { UserInSession } from '@/features/auth/auth.model';
import { clientAuth } from '@/lib/firebase/client';
import { isProtectedRoute } from '@/routes';
import { User as FirebaseUser, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { usePathname } from 'next/navigation';
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  user: UserInSession | null;
  firebaseUser: FirebaseUser | null;
  setUser: Dispatch<SetStateAction<UserInSession | null>>;
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
  const pathname = usePathname();

  useEffect(() => {
    setUser(serverUser);
  }, [serverUser]);

  // 1. ZOMBIE SESSION CLEANUP
  // If server says "No User" but we are on a protected route, force logout.
  useEffect(() => {
    if (serverUser === null && isProtectedRoute(pathname)) {
      logoutAction().then(() => {
        window.location.href = '/login?reason=session_revoked';
      });
    }
  }, [serverUser, pathname]);

  // 2. ❤️ HEARTBEAT: Instant Revocation Check ❤️
  useEffect(() => {
    // Only poll if we think we are logged in
    if (!user) return;

    const checkStatus = async () => {
      // Calls the server action. If session is revoked in DB, middleware throws error.
      const result = await checkSessionAction();

      // If server error or explicit failure
      if (result?.serverError || (result?.data && !result.data.success)) {
        console.warn('Session Heartbeat Failed: Revoked remotely.');
        window.location.href = '/login?reason=session_revoked_remote';
      }
    };

    // A. Check immediately on focus (User switches tabs)
    const onFocus = () => checkStatus();
    window.addEventListener('focus', onFocus);

    // B. Check periodically (every 5 seconds)
    const interval = setInterval(() => {
      checkStatus();
    }, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user]);

  // 3. Client SDK Sync
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
            await signInWithCustomToken(clientAuth, result.data.data);
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
    <RNGAuthContext.Provider value={{ user, firebaseUser, setUser, isSyncing }}>
      {children}
    </RNGAuthContext.Provider>
  );
}
