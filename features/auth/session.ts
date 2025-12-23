import 'server-only';

import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { toMillis } from '@/lib/firebase/utils';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { UserInSession } from './auth.model';
import { sessionCache } from './redis-session';

import { sessionRepository } from './repositories/session.repository';
import { userRepository } from './repositories/user.repository';

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

  if (!sessionCookie || !sessionId) return null;

  try {
    let uid: string | null = null;

    // --- LEVEL 1: REDIS CACHE (Fastest) ---
    const cachedUid = await sessionCache.verify(sessionId);

    if (cachedUid) {
      uid = cachedUid;
    } else {
      // --- LEVEL 2: FIRESTORE FALLBACK (Slower but Persistent) ---
      const decodedClaims = await sessionRepository.verifySessionCookie(sessionCookie);
      const dbSession = await sessionRepository.getSession(decodedClaims.uid, sessionId);

      if (!dbSession || !dbSession.isValid) {
        return null;
      }

      const now = Date.now();
      const expiresAt = toMillis(dbSession.expiresAt);

      if (expiresAt < now) {
        return null;
      }

      // RE-HYDRATE REDIS if valid
      await sessionCache.store(sessionId, decodedClaims.uid, expiresAt);
      uid = decodedClaims.uid;
    }

    if (!uid) return null;

    // --- LEVEL 3: USER PROFILE FETCH ---
    const user = await userRepository.getUser(uid);

    // Self-Healing: Auto-sync verification
    if (!user.emailVerified) {
      try {
        const firebaseUser = await auth().getUser(user.uid);
        if (firebaseUser.emailVerified) {
          await userRepository.updateUser(user.uid, { emailVerified: true });
          user.emailVerified = true;
        }
      } catch (e) {
        // ignore
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
    return null;
  }
});
