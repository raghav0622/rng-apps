'use client';

import { useRouter } from 'next/navigation';

import { createSessionAction, signupAction } from '@/features/auth/auth.actions';
import { SignupInput } from '@/features/auth/auth.model';
import { clientAuth } from '@/lib/firebase/client';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { signInWithCustomToken } from 'firebase/auth';

export function useSignup() {
  const router = useRouter();

  // signupAction returns the Custom Token (Result<string>)
  const { runAction: signUp } = useRNGServerAction(signupAction);

  const { runAction: createSession } = useRNGServerAction(createSessionAction, {
    successMessage: 'Account Created Successfully',
  });

  const handleSignup = async (data: SignupInput) => {
    // 1. Create User on Server (DB + Auth) -> Returns Custom Token
    const customToken = (await signUp(data)) || '';

    // 2. Sign in on Client with Custom Token to establish SDK state
    const userCredential = await signInWithCustomToken(clientAuth, customToken);

    // 3. Get ID Token
    const idToken = await userCredential.user.getIdToken();

    // 4. Create Session
    await createSession({
      idToken,
    });

    router.push(DEFAULT_LOGIN_REDIRECT);
    router.refresh();
  };

  return handleSignup;
}
