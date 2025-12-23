'use client';

import { LoginInput } from '@/features/auth/auth.model';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { FormError } from '@/rng-form';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSessionAction } from '../actions/session.actions';
import { mapAuthError } from '../utils/auth-errors';
import { useFirebaseClientAuth } from './useFirebaseClientAuth';

export function useSignin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInEmail } = useFirebaseClientAuth();

  const { runAction: createSession } = useRNGServerAction(createSessionAction, {
    successMessage: 'Account Login Successful',
  });

  const handleSubmit = async (data: LoginInput) => {
    try {
      // 1. Authenticate with Firebase Client SDK (Verifies Password)
      const idToken = await signInEmail(data.email, data.password);

      // 2. Create the HTTP-only Session Cookie via Server Action
      await createSession({ idToken });

      // 3. Redirect
      const redirectTo = searchParams.get('redirect_to') || DEFAULT_LOGIN_REDIRECT;
      router.push(redirectTo);
      router.refresh();
    } catch (error: any) {
      // Use centralized error mapping
      const errorMsg = mapAuthError(error.code, error.message);
      throw new FormError(errorMsg);
    }
  };

  return handleSubmit;
}
