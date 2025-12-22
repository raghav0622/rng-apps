import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { getCookieOptions, SESSION_DURATION_MS } from '@/lib/cookie-utils';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { AdminFirestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { cookies, headers } from 'next/headers';
import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '../auth.model';
import { sessionRepository } from '../repositories/session.repository';
import { userRepository } from '../repositories/user.repository';

export class SessionService {
  static async createSession(idToken: string): Promise<Result<void>> {
    try {
      const decodedToken = await sessionRepository.verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const authSessionCookie = await sessionRepository.createSessionCookie(
        idToken,
        SESSION_DURATION_MS,
      );
      const sessionId = uuidv4();
      const headersList = await headers();

      await Promise.all([
        decodedToken.email_verified
          ? userRepository.updateUser(uid, { emailVerified: true }).catch(console.error)
          : Promise.resolve(),

        sessionRepository.createSessionRecord({
          sessionId,
          uid,
          createdAt: AdminFirestore.Timestamp.now(),
          expiresAt: AdminFirestore.Timestamp.fromMillis(Date.now() + SESSION_DURATION_MS),
          ip: headersList.get('x-forwarded-for') || 'unknown',
          userAgent: headersList.get('user-agent') || 'unknown',
          isValid: true,
        }),
      ]);

      const cookieStore = await cookies();
      const options = getCookieOptions();

      cookieStore.set(AUTH_SESSION_COOKIE_NAME, authSessionCookie, options);
      cookieStore.set(SESSION_ID_COOKIE_NAME, sessionId, options);

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Create Session Error:', error);
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Failed to create secure session.');
    }
  }

  static async logout(): Promise<Result<void>> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
    const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

    if (sessionCookie && sessionId) {
      try {
        const claims = await sessionRepository.verifySessionCookie(sessionCookie);
        await sessionRepository.deleteSessionRecord(claims.uid, sessionId);
      } catch (e) {
        // Session likely already invalid
      }
    }

    cookieStore.delete(AUTH_SESSION_COOKIE_NAME);
    cookieStore.delete(SESSION_ID_COOKIE_NAME);

    return { success: true, data: undefined };
  }

  static async revokeAllSessions(userId: string): Promise<Result<void>> {
    try {
      await sessionRepository.revokeAllUserSessions(userId);
      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to revoke sessions');
    }
  }

  // --- NEWLY ADDED METHODS ---

  static async getActiveSessions(userId: string): Promise<Result<Session[]>> {
    try {
      const sessions = await sessionRepository.getUserSessions(userId);
      return { success: true, data: sessions };
    } catch (error) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to get sessions');
    }
  }

  static async revokeSession(userId: string, sessionId: string): Promise<Result<void>> {
    try {
      await sessionRepository.deleteSessionRecord(userId, sessionId);
      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to revoke session');
    }
  }
}
