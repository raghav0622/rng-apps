'use client';

import { LoginInput } from '@/features/auth/auth.model';
import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { FormError } from '@/rng-form';
import { useRouter } from 'next/navigation';
import { createSessionAction } from '../actions/session.actions';
import { mapAuthError } from '../utils/auth-errors';
import { useFirebaseClientAuth } from './useFirebaseClientAuth';

export function useSignin() {
  const router = useRouter();
  const { signInEmail } = useFirebaseClientAuth();
  const { refreshSession } = useRNGAuth(); // Destructure setUser

  const { runAction: createSession } = useRNGServerAction(createSessionAction, {
    successMessage: 'Account Login Successful',
  });

  const handleSubmit = async (data: LoginInput) => {
    try {
      const idToken = await signInEmail(data.email, data.password);
      await createSession({ idToken });

      // Explicitly update client state before redirecting
      const updatedUser = await refreshSession();

      if (updatedUser && !updatedUser.onboarded) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (error: any) {
      throw new FormError(mapAuthError(error.code, error.message));
    }
  };

  return handleSubmit;
}
