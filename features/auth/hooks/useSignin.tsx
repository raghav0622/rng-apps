'use client';

import { LoginInput } from '@/features/auth/auth.model';
import { clientAuth } from '@/lib/firebase/client';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { FormError } from '@/rng-form';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSessionAction } from '../actions/session.actions';

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
      let msg = error.message;
      if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
      if (error.code === 'auth/user-not-found') msg = 'Account not found.';
      if (error.code === 'auth/wrong-password') msg = 'Incorrect password.';
      if (error.code === 'auth/too-many-requests')
        msg = 'Too many failed attempts. Try again later.';

      throw new FormError(msg);
    }
  };

  return handleSubmit;
}
