'use client';

import { createSessionAction, signinAction } from '@/features/auth/auth.actions';
import { LoginInput } from '@/features/auth/auth.model';
import { useRNGServerAction } from '@/hooks/use-rng-action';
import { clientAuth } from '@/lib/firebase/client';
import { FormError } from '@/rng-form';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { signInWithCustomToken, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';

export function useSignin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { runAction: createSession } = useRNGServerAction(createSessionAction, {
    successMessage: 'Account Login Successfuly',
  });
  const { runAction: getCustomSignInToken } = useRNGServerAction(signinAction);

  const handleSubmit = async (data: LoginInput) => {
    try {
      await signInWithEmailAndPassword(clientAuth, data.email, data.password);
      const customToken = await getCustomSignInToken({ email: data.email });
      const customTokens = await signInWithCustomToken(clientAuth, customToken);
      const idToken = (await customTokens.user.getIdTokenResult()).token;
      await createSession({
        idToken,
      });
      const redirectTo = searchParams.get('redirect_to') || DEFAULT_LOGIN_REDIRECT;
      router.push(redirectTo);
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
