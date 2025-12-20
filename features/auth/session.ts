import { authRepository } from '@/features/auth/auth.repository';
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { cookies } from 'next/headers';
import { cache } from 'react';
import 'server-only';
import { UserInSession } from './auth.model';

/**
 * Server-Side: Get current user.
 * @param ensureDbProfile If true, fetches fresh data from Firestore (needed for orgId checks).
 */
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    const decodedClaims = await authRepository.verifySessionCookie(sessionCookie);
    const data = {
      displayName: decodedClaims.displayName,
      email: decodedClaims.email,
      onboarded: decodedClaims.onboarded,
      orgRole: decodedClaims.orgRole,
      uid: decodedClaims.uid,
      orgId: decodedClaims.orgId,
      photoUrl: decodedClaims.photUrl,
    } as UserInSession;
    return data;
  } catch (error) {
    return null;
  }
});
