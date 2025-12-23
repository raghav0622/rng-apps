'use client';

import { FormError } from '@/rng-form';
import { ConfirmPasswordInput } from '../auth.model';
import { mapAuthError } from '../utils/auth-errors';
import { useFirebaseClientAuth } from './useFirebaseClientAuth';

export function useConfirmPassword(onConfirm: () => Promise<void>) {
  const { signInEmail, currentUser } = useFirebaseClientAuth();

  const handleConfirm = async (data: ConfirmPasswordInput) => {
    // If auth state isn't loaded yet, strictly we shouldn't be here,
    // but we check to be safe.
    if (!currentUser?.email) return;

    try {
      // 1. Re-authenticate to ensure the user is who they say they are
      // (This verifies the password against the current session's email)
      await signInEmail(currentUser.email, data.password);

      // 2. Execute the sensitive action
      await onConfirm();
    } catch (error: any) {
      // 3. Handle errors (e.g., wrong password)
      throw new FormError(mapAuthError(error.code, 'Authentication failed'));
    }
  };

  return { handleConfirm };
}
