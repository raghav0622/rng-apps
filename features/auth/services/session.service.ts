import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { getCookieOptions, SESSION_DURATION_MS } from '@/lib/cookie-utils';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { AdminFirestore } from '@/lib/firebase/admin';
import { toMillis } from '@/lib/firebase/utils';
import { Result } from '@/lib/types';
import { cookies, headers } from 'next/headers';
import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import { Session, SessionDb } from '../auth.model';
import { sessionRepository } from '../repositories/session.repository';
import { userRepository } from '../repositories/user.repository';

export class SessionService {
  /**
   * Robustly extracts the real client IP, handling proxy chains.
   */
  private static async getClientIp(): Promise<string> {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    return headersList.get('x-real-ip') || 'unknown';
  }

  // Atomic Step 1: Verification
  private static async verifyAndGetUid(idToken: string) {
    const decoded = await sessionRepository.verifyIdToken(idToken);
    return { uid: decoded.uid, emailVerified: decoded.email_verified };
  }

  // Atomic Step 2: Persistence
  private static async persistSession(uid: string, userAgent: string, ip: string) {
    const sessionId = uuidv4();

    // Construct DB Object with Firestore Timestamps
    const sessionData: SessionDb = {
      sessionId,
      uid,
      createdAt: AdminFirestore.Timestamp.now(),
      expiresAt: AdminFirestore.Timestamp.fromMillis(Date.now() + SESSION_DURATION_MS),
      ip,
      userAgent,
      isValid: true,
    };

    await sessionRepository.createSessionRecord(sessionData);
    return sessionId;
  }

  // Atomic Step 3: Cookie Generation
  private static async generateCookies(idToken: string, sessionId: string) {
    const authSessionCookie = await sessionRepository.createSessionCookie(
      idToken,
      SESSION_DURATION_MS,
    );
    const cookieStore = await cookies();
    const options = getCookieOptions();

    cookieStore.set(AUTH_SESSION_COOKIE_NAME, authSessionCookie, options);
    cookieStore.set(SESSION_ID_COOKIE_NAME, sessionId, options);
  }

  // Orchestrator
  static async createSession(idToken: string): Promise<Result<void>> {
    try {
      const headersList = await headers();
      const userAgent = headersList.get('user-agent') || 'unknown';
      const ip = await this.getClientIp();

      // 1. Verify
      const { uid, emailVerified } = await this.verifyAndGetUid(idToken);

      // 2. Side Effect: Sync Verification Status
      if (emailVerified) {
        userRepository.updateUser(uid, { emailVerified: true }).catch(console.error);
      }

      // 3. Persist & Set Cookies
      const sessionId = await this.persistSession(uid, userAgent, ip);
      await this.generateCookies(idToken, sessionId);

      return { success: true, data: undefined };
    } catch (error: any) {
      console.error('Create Session Error:', error);
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, error.message);
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

  static async getActiveSessions(userId: string): Promise<Result<Session[]>> {
    try {
      // 1. Get raw DB records
      const dbSessions = await sessionRepository.getUserSessions(userId);

      // 2. Transform to Client DTOs (Serialize Timestamps)
      const clientSessions: Session[] = dbSessions.map((s) => ({
        ...s,
        createdAt: toMillis(s.createdAt),
        expiresAt: toMillis(s.expiresAt),
      }));

      return { success: true, data: clientSessions };
    } catch (error) {
      console.error('Get Sessions Error:', error);
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
