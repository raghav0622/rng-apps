'use client';

import { SignupInput } from '@/features/auth/auth.model';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { DEFAULT_LOGIN_REDIRECT, ONBOARDING_ROUTE } from '@/routes';
import { useRouter } from 'next/navigation';
import { createSessionAction, signupAction } from '../actions/session.actions';
import { useRNGAuth } from '../components/AuthContext';
import { useFirebaseClientAuth } from './useFirebaseClientAuth';

export function useSignup() {
  const router = useRouter();
  const { signInCustom, clientLogout } = useFirebaseClientAuth();
  const { refreshSession } = useRNGAuth();

  const { runAction: signUp } = useRNGServerAction(signupAction);
  const { runAction: createSession } = useRNGServerAction(createSessionAction, {
    successMessage: 'Account Created Successfully',
  });

  const handleSignup = async (data: SignupInput) => {
    try {
      // 1. Create User on Server
      const customToken = await signUp(data);
      if (!customToken) return;

      // 2. Sign in on Client with Custom Token
      const idToken = await signInCustom(customToken);

      // 3. Create Session (Cookie)
      await createSession({ idToken });

      // 4. FORCE REFRESH: Sync the AuthContext state with the new cookie
      const updatedUser = await refreshSession();

      // 5. Navigate based on onboarding status
      if (updatedUser && !updatedUser.onboarded) {
        router.push(ONBOARDING_ROUTE);
      } else {
        router.push(DEFAULT_LOGIN_REDIRECT);
      }

      router.refresh();
    } catch (error) {
      console.error('Signup sequence failed:', error);
      await clientLogout();
    }
  };

  return handleSignup;
}
