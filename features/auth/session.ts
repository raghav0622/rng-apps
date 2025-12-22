import 'server-only';

import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { UserInSession } from './auth.model';

// CHANGE: Import the new split repositories
import { sessionRepository } from './repositories/session.repository';
import { userRepository } from './repositories/user.repository';

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

  if (!sessionCookie || !sessionId) return null;

  try {
    // 1. Verify Crypto Signature (Use SessionRepo)
    const decodedClaims = await sessionRepository.verifySessionCookie(sessionCookie);

    // 2. Persistence Check (Use SessionRepo)
    const isValidSession = await sessionRepository.isSessionValid(decodedClaims.uid, sessionId);

    if (!isValidSession) {
      return null;
    }

    // 3. FETCH FRESH DATA FROM DB (Use UserRepo)
    const user = await userRepository.getUser(decodedClaims.uid);

    // 4. SELF-HEALING: Auto-sync verification status
    if (!user.emailVerified) {
      try {
        const firebaseUser = await auth().getUser(user.uid);
        if (firebaseUser.emailVerified) {
          // Use UserRepo to update
          await userRepository.updateUser(user.uid, { emailVerified: true });
          user.emailVerified = true;
        }
      } catch (e) {
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
      emailVerified: user.emailVerified,
    } as UserInSession;
  } catch (error) {
    console.error('getCurrentUser Error:', error);
    return null;
  }
});
