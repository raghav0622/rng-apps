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
    // 1. Verify Crypto Signature of the Firebase Cookie
    const decodedClaims = await authRepository.verifySessionCookie(sessionCookie);

    // 2. Persistence Check: Does this specific session exist in Firestore?
    const isValidSession = await authRepository.isSessionValid(decodedClaims.uid, sessionId);

    if (!isValidSession) {
      return null;
    }

    // 3. Data Construction
    // If the cookie is missing critical custom claims (like orgRole), we MUST fetch from DB.
    if (!decodedClaims.orgRole) {
      const user = await authRepository.getUser(decodedClaims.uid);

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl || '',
        onboarded: user.onboarded,
        orgRole: user.orgRole,
        // Ensure this defaults to "" if undefined/null
        orgId: user.orgId || '',
      } as UserInSession;
    }

    // Fast Path: If claims exist (e.g. set via Custom Claims), use them.
    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
      displayName: decodedClaims.name || decodedClaims.displayName || '',
      photoUrl: decodedClaims.picture || decodedClaims.photoUrl || '',
      onboarded: !!decodedClaims.onboarded,
      orgRole: decodedClaims.orgRole || 'NOT_IN_ORG',
      // Ensure this defaults to "" if undefined/null
      orgId: decodedClaims.orgId || '',
    } as UserInSession;
  } catch (error) {
    console.error('getCurrentUser Error:', error);
    return null;
  }
});
