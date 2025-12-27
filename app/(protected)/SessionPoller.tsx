'use client';

import { checkSessionAction } from '@/core/auth/auth.actions';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { useEffect } from 'react';

const POLLING_INTERVAL = 1000 * 10; // Check every 30 seconds

export function SessionPoller() {
  const { runAction } = useRNGServerAction(checkSessionAction, {
    onError: (msg, code) => {
      // If validation fails (401), reload to force middleware to redirect to login
      if (
        code === 'UNAUTHENTICATED' ||
        msg.includes('revoked') ||
        msg.includes('Session missing')
      ) {
        window.location.reload();
      }
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // We don't need the result, just checking if it fails
      runAction(undefined).catch(() => {});
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [runAction]);

  return null;
}
