'use client';

import { LoginInput } from '@/features/auth/auth.model';
import { clientAuth } from '@/lib/firebase/client';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { FormError } from '@/rng-form';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSessionAction } from '../actions/session.actions';
import { mapAuthError } from '../utils/auth-errors';

export function useSignin() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { runAction: createSession } = useRNGServerAction(createSessionAction, {
    successMessage: 'Account Login Successful',
  });

  const handleSubmit = async (data: LoginInput) => {
    try {
      // 1. Authenticate with Firebase Client SDK (Verifies Password)
      const userCredential = await signInWithEmailAndPassword(
        clientAuth,
        data.email,
        data.password,
      );

      // 2. Get the ID Token to send to the server
      const idToken = await userCredential.user.getIdToken();

      // 3. Create the HTTP-only Session Cookie
      await createSession({
        idToken,
      });

      // 4. Redirect
      const redirectTo = searchParams.get('redirect_to') || DEFAULT_LOGIN_REDIRECT;
      router.push(redirectTo);
      router.refresh(); // Ensure server components update immediately
    } catch (error: any) {
      // Use centralized error mapping
      const errorMsg = mapAuthError(error.code, error.message);
      throw new FormError(errorMsg);
    }
  };

  return handleSubmit;
}
