'use client';

import { logoutAction } from '@/features/auth/actions/session.actions';
import { clientAuth } from '@/lib/firebase/client';
import { LoadingSpinner } from '@/ui/LoadingSpinner';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function LogoutPage() {
  const router = useRouter();
  const hasCalledLogout = useRef(false);

  useEffect(() => {
    const performLogout = async () => {
      if (hasCalledLogout.current) return;
      hasCalledLogout.current = true;

      try {
        // 1. Clear Server Session (Cookies)
        await logoutAction();

        // 2. Clear Client SDK State (IndexedDB/LocalStorage)
        await signOut(clientAuth);
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        // 3. Redirect to Login
        router.replace('/login');
        router.refresh();
      }
    };

    performLogout();
  }, [router]);

  return <LoadingSpinner message="Logging Out..." />;
}
