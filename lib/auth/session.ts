import { authRepository } from '@/features/auth/auth.repository';
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { cookies } from 'next/headers';
import { cache } from 'react';
import 'server-only';

export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Server-Side: Get current user.
 * Strategy: Verify Cookie for Auth -> Fetch Firestore for Data.
 * Cached per request to avoid multiple Firestore reads.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    // 1. Verify Identity (Fast, Low Latency check)
    const decodedClaims = await authRepository.verifySessionCookie(sessionCookie);
    const uid = decodedClaims.uid;

    // 2. Fetch Fresh Data (Source of Truth)
    // We do NOT use decodedClaims for profile data because:
    // a) It might be stale (cached in cookie).
    // b) Large Base64 avatars don't fit in cookies.
    const userProfile = await authRepository.getUser(uid);

    if (!userProfile) {
      // Edge case: User deleted in Firestore but cookie still valid
      return null;
    }

    return {
      uid: userProfile.uid,
      email: userProfile.email,
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL,
    };
  } catch (error) {
    // Cookie is invalid or expired
    return null;
  }
});
