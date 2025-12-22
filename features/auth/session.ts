import 'server-only';

import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
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

    // 3. FETCH FRESH DATA [CRITICAL FIX]
    // We strictly use the DB for profile data because the Cookie is immutable
    // and becomes stale immediately after a profile update.
    const user = await authRepository.getUser(decodedClaims.uid);

    return {
      uid: user.uid,
      email: user.email, // Prefer DB email
      displayName: user.displayName, // Always fresh from DB
      photoUrl: user.photoUrl || '', // Always fresh from DB
      onboarded: user.onboarded,
      orgRole: user.orgRole,
      orgId: user.orgId || '',
    } as UserInSession;
  } catch (error) {
    console.error('getCurrentUser Error:', error);
    return null;
  }
});
