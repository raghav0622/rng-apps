'use client';
import { useRouter } from 'next/navigation';

import { createSessionAction, signupAction } from '@/features/auth/auth.actions';
import { SignupInput } from '@/features/auth/auth.model';
import { useRNGServerAction } from '@/hooks/use-rng-action';
import { clientAuth } from '@/lib/firebase/client';
import { signInWithCustomToken } from 'firebase/auth';

export function useSignup() {
  const router = useRouter();
  const { runAction: signUp } = useRNGServerAction(signupAction);
  const { runAction: createSession } = useRNGServerAction(createSessionAction, {
    successMessage: 'Account Created Successfuly',
  });

  const handleSignup = async (data: SignupInput) => {
    const result = await signUp(data);

    const customTokens = await signInWithCustomToken(clientAuth, result);
    const idToken = (await customTokens.user.getIdTokenResult()).token;

    await createSession({
      idToken,
    });

    router.push('/');
  };

  return handleSignup;
}
