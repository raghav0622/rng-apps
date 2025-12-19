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
  orgId?: string | null;
}

/**
 * Server-Side: Get current user.
 * @param ensureDbProfile If true, fetches fresh data from Firestore (needed for orgId checks).
 */
export const getCurrentUser = cache(
  async (ensureDbProfile = false): Promise<SessionUser | null> => {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) return null;

    try {
      // 1. Verify Identity
      const decodedClaims = await authRepository.verifySessionCookie(sessionCookie);

      // 2. If we just need basic info, return claims (Fast)
      if (!ensureDbProfile) {
        return {
          uid: decodedClaims.uid,
          email: decodedClaims.email ?? null,
          displayName: (decodedClaims.name as string) ?? null,
          photoURL: (decodedClaims.picture as string) ?? null,
          // orgId is missing here, which is fine for UI, bad for Logic
        };
      }

      // 3. If we need Org Context, fetch DB (Slower, Consistent)
      const dbUser = await authRepository.getUser(decodedClaims.uid);
      return dbUser;
    } catch (error) {
      return null;
    }
  },
);
