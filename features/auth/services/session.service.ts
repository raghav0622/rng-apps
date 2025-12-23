import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { getCookieOptions, SESSION_DURATION_MS } from '@/lib/cookie-utils';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { AdminFirestore, auth } from '@/lib/firebase/admin';
import { toMillis } from '@/lib/firebase/utils';
import { Result } from '@/lib/types';
import { cookies, headers } from 'next/headers';
import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import { Session, SessionDb, User } from '../auth.model';
import { sessionCache } from '../redis-session';
import { sessionRepository } from '../repositories/session.repository';
import { userRepository } from '../repositories/user.repository';

export class SessionService {
  /**
   * Validates if a session is truly active by checking Redis first, then Firestore.
   * This allows us to catch revoked sessions instantly.
   */
  static async validateSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      // 1. Fast Path: Check Redis
      const cachedUserId = await sessionCache.verify(sessionId);
      if (cachedUserId) {
        // If the ID in cache matches the user, it's valid
        return cachedUserId === userId;
      }

      // 2. Slow Path: Check Firestore (System of Truth)
      // This handles cases where Redis evicted the key but the session is still valid in DB.
      const session = await sessionRepository.getSession(userId, sessionId);

      if (session && session.isValid) {
        const expiresAt = toMillis(session.expiresAt);
        if (expiresAt > Date.now()) {
          // It was valid in DB but missing in Cache -> Re-populate Cache
          await sessionCache.store(sessionId, userId, expiresAt);
          return true;
        }
      }

      // If missing in both or invalid/expired
      return false;
    } catch (error) {
      console.error('Session Validation Error:', error);
      return false;
    }
  }

  static async getUserFromSession(): Promise<User | null> {
    const sessionCookie = (await cookies()).get(AUTH_SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) return null;

    try {
      // 1. Verify the session cookie
      const decodedClaims = await auth().verifySessionCookie(sessionCookie, true);

      // 2. Fetch the FULL user from the repository (which now includes sanitizeData)
      const user = await userRepository.getUserIncludeDeleted(decodedClaims.uid);

      if (!user || user.deletedAt) return null;

      return user;
    } catch (error) {
      return null;
    }
  }

  // --- Helpers ---

  private static async getClientIp(): Promise<string> {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    return headersList.get('x-real-ip') || 'unknown';
  }

  private static async verifyAndGetUid(idToken: string) {
    const decoded = await sessionRepository.verifyIdToken(idToken);
    return { uid: decoded.uid, emailVerified: decoded.email_verified };
  }

  private static async persistSession(uid: string, userAgent: string, ip: string) {
    const sessionId = uuidv4();
    const now = Date.now();
    const expiresAtMs = now + SESSION_DURATION_MS;

    const sessionData: SessionDb = {
      sessionId,
      uid,
      createdAt: AdminFirestore.Timestamp.fromMillis(now),
      expiresAt: AdminFirestore.Timestamp.fromMillis(expiresAtMs),
      ip,
      userAgent,
      isValid: true,
    };

    await sessionRepository.createSessionRecord(sessionData);
    await sessionCache.store(sessionId, uid, expiresAtMs);

    return sessionId;
  }

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

  /**
   * Public helper to robustly clear cookies
   */
  public static async clearCookies() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_SESSION_COOKIE_NAME);
    cookieStore.delete(SESSION_ID_COOKIE_NAME);
  }

  // --- Actions ---

  static async createSession(idToken: string): Promise<Result<void>> {
    try {
      const headersList = await headers();
      const userAgent = headersList.get('user-agent') || 'unknown';
      const ip = await this.getClientIp();

      const { uid, emailVerified } = await this.verifyAndGetUid(idToken);

      if (emailVerified) {
        userRepository.updateUser(uid, { emailVerified: true }).catch(console.error);
      }

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
    const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

    if (sessionId) {
      await sessionCache.revoke(sessionId);
      // Optional: Mark as invalid in Firestore if you want audit trails
      // await sessionRepository.deleteSessionRecord(..., sessionId);
    }

    await this.clearCookies();
    return { success: true, data: undefined };
  }

  static async revokeAllSessions(userId: string): Promise<Result<void>> {
    try {
      const sessions = await sessionRepository.getUserSessions(userId);
      const sessionIds = sessions.map((s) => s.sessionId);

      await sessionCache.revokeMultiple(sessionIds);
      await sessionRepository.revokeAllUserSessions(userId);

      // Important: Clear cookies for the current user initiating the action
      await this.clearCookies();

      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to revoke sessions');
    }
  }

  static async getActiveSessions(userId: string): Promise<Result<Session[]>> {
    try {
      const dbSessions = await sessionRepository.getUserSessions(userId);

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
      await sessionCache.revoke(sessionId);
      await sessionRepository.deleteSessionRecord(userId, sessionId);
      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to revoke session');
    }
  }
}
