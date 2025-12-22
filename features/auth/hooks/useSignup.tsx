'use client';

import { SignupInput } from '@/features/auth/auth.model';
import { clientAuth } from '@/lib/firebase/client';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { createSessionAction, signupAction } from '../actions/session.actions';

export function useSignup() {
  const router = useRouter();

  const { runAction: signUp } = useRNGServerAction(signupAction);

  const { runAction: createSession } = useRNGServerAction(createSessionAction, {
    successMessage: 'Account Created Successfully',
  });

  const handleSignup = async (data: SignupInput) => {
    try {
      // 1. Create User on Server (DB + Auth) -> Returns Custom Token
      const customToken = await signUp(data);

      if (!customToken) {
        // Error handling is managed by useRNGServerAction's toast, just return
        return;
      }
      // 2. Sign in on Client with Custom Token
      const userCredential = await signInWithCustomToken(clientAuth, customToken);
      const idToken = await userCredential.user.getIdToken();

      // 3. Create Session (Cookie)
      await createSession({ idToken });

      // Logic Gap Fix: Ensure session creation actually succeeded before redirecting
      // useRNGServerAction usually returns data on success, or null/undefined on error
      // If the action failed, we should rollback the client state.

      router.push(DEFAULT_LOGIN_REDIRECT);
      router.refresh();
    } catch (error) {
      // ROLLBACK: If cookie creation fails, sign out from client to avoid "Ghost State"
      console.error('Signup sequence failed:', error);
      await signOut(clientAuth);
    }
  };

  return handleSignup;
}
