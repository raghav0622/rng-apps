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
    // 1. Verify Crypto Signature (Fast, local check)
    // The claims here are populated from the 'setCustomUserClaims' we did during signup.
    const decodedClaims = await authRepository.verifySessionCookie(sessionCookie);

    // 2. Persistence Check
    // This DB check handles "is the user deleted?" and "is this session revoked?"
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
      photoUrl: decodedClaims.picture,
    } as UserInSession;

    return data;
  } catch (error) {
    return null;
  }
});
