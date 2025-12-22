// features/auth/session.ts
import 'server-only';

import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { UserInSession } from './auth.model';
import { authRepository } from './auth.repository';

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

  if (!sessionCookie || !sessionId) return null;

  try {
    // 1. Verify Crypto Signature
    const decodedClaims = await authRepository.verifySessionCookie(sessionCookie);

    // 2. Persistence Check
    const isValidSession = await authRepository.isSessionValid(decodedClaims.uid, sessionId);

    if (!isValidSession) {
      return null;
    }

    // 3. FETCH FRESH DATA FROM DB
    const user = await authRepository.getUser(decodedClaims.uid);

    // 4. SELF-HEALING: Auto-sync verification status
    // If DB says "Unverified" but User verified on another device, this fixes it.
    if (!user.emailVerified) {
      try {
        const firebaseUser = await auth().getUser(user.uid);
        if (firebaseUser.emailVerified) {
          await authRepository.updateUser(user.uid, { emailVerified: true });
          user.emailVerified = true; // Update local object to reflect change immediately
        }
      } catch (e) {
        // Ignore auth check errors, fallback to DB state
        console.warn('Background verification sync failed:', e);
      }
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl || '',
      onboarded: user.onboarded,
      orgRole: user.orgRole,
      orgId: user.orgId || '',
      emailVerified: user.emailVerified, // Ensure this is included in your UserInSession type
    } as UserInSession;
  } catch (error) {
    console.error('getCurrentUser Error:', error);
    return null;
  }
});
