'use client';

import { logoutAction } from '@/features/auth/actions/session.actions';
import { useRNGAuth } from '@/features/auth/components/AuthContext'; // <--- Import Auth Context
import { useFirebaseClientAuth } from '@/features/auth/hooks/useFirebaseClientAuth';
import { LoadingSpinner } from '@/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function LogoutPage() {
  const router = useRouter();
  const { clientLogout } = useFirebaseClientAuth();
  const { setUser } = useRNGAuth(); // <--- Get state setter
  const hasCalledLogout = useRef(false);

  useEffect(() => {
    const performLogout = async () => {
      // Prevent double execution in React Strict Mode
      if (hasCalledLogout.current) return;
      hasCalledLogout.current = true;

      try {
        // 1. Clear Server Session (Cookies)
        await logoutAction();

        // 2. Clear Client SDK State (IndexedDB/LocalStorage)
        await clientLogout();

        // 3. Clear Client Context State IMMEDIATELY
        setUser(null);
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        // 4. Redirect to Login
        router.replace('/login');
        router.refresh();
      }
    };

    performLogout();
  }, [router, clientLogout, setUser]);

  return <LoadingSpinner message="Logging Out..." />;
}
