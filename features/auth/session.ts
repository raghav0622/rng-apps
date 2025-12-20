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
    // checkRevoked: true checks if the user's tokens were globally revoked via revokeAllSessions
    const decodedClaims = await authRepository.verifySessionCookie(sessionCookie); // Add checkRevoked logic in repo if desired

    // 2. Persistence Check: Does this specific session exist in Firestore?
    // This handles the case where a user was manually deleted or this specific session was kicked.
    const isValidSession = await authRepository.isSessionValid(decodedClaims.uid, sessionId);

    if (!isValidSession) {
      return null;
    }

    const data = {
      displayName: decodedClaims.displayName,
      email: decodedClaims.email,
      onboarded: decodedClaims.onboarded,
      orgRole: decodedClaims.orgRole,
      uid: decodedClaims.uid,
      orgId: decodedClaims.orgId,
      photoUrl: decodedClaims.picture, // Note: Firebase standard claim is 'picture', not 'photUrl' usually. Check your custom token logic.
    } as UserInSession;

    return data;
  } catch (error) {
    return null;
  }
});
