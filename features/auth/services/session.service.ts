import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { getCookieOptions, SESSION_DURATION_MS } from '@/lib/cookie-utils';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { AdminFirestore } from '@/lib/firebase/admin';
import { toMillis } from '@/lib/firebase/utils';
import { Result } from '@/lib/types';
import { cookies, headers } from 'next/headers';
import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import { Session, SessionDb, User } from '../auth.model';
import { sessionCache } from '../redis-session';
import { sessionRepository } from '../repositories/session.repository';
import { userRepository } from '../repositories/user.repository';

// New interface for cached data
interface CachedSessionData {
  userId: string;
  user?: Partial<User>; // Cache minimal user data
}

export class SessionService {
  /**
   * Validates session + Returns cached User data (Optimization)
   * Implements Sliding Window expiration.
   */
  static async validateSession(
    userId: string,
    sessionId: string,
  ): Promise<{ isValid: boolean; cachedUser?: Partial<User> }> {
    try {
      // 1. Fast Path: Check Redis
      const cachedData = (await sessionCache.verify(sessionId)) as unknown as
        | CachedSessionData
        | string
        | null;

      let cachedUserId: string | undefined;
      let cachedUser: Partial<User> | undefined;

      // Handle legacy cache (string) vs new cache (object)
      if (typeof cachedData === 'string') {
        cachedUserId = cachedData;
      } else if (cachedData && typeof cachedData === 'object') {
        cachedUserId = cachedData.userId;
        cachedUser = cachedData.user;
      }

      if (cachedUserId && cachedUserId === userId) {
        // --- Sliding Window Logic ---
        // Extend the Redis key TTL so active users stay logged in
        await sessionCache.extend(sessionId, SESSION_DURATION_MS);

        return { isValid: true, cachedUser };
      }

      // 2. Slow Path: Check Firestore (System of Truth)
      const session = await sessionRepository.getSession(userId, sessionId);

      if (session && session.isValid) {
        const expiresAt = toMillis(session.expiresAt);
        if (expiresAt > Date.now()) {
          // Valid in DB -> Re-populate Cache
          const user = await userRepository.getUserIncludeDeleted(userId);

          if (user) {
            const userDataForCache: CachedSessionData = {
              userId,
              user: {
                uid: user.uid,
                email: user.email,
                orgId: user.orgId,
                orgRole: user.orgRole,
                deletedAt: user.deletedAt,
              },
            };
            // Store object
            await sessionCache.store(sessionId, JSON.stringify(userDataForCache), expiresAt);
            return { isValid: true, cachedUser: userDataForCache.user };
          }
        }
      }

      return { isValid: false };
    } catch (error) {
      console.error('Session Validation Error:', error);
      return { isValid: false };
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

  private static async persistSession(user: User, userAgent: string, ip: string) {
    const sessionId = uuidv4();
    const now = Date.now();
    const expiresAtMs = now + SESSION_DURATION_MS;

    const sessionData: SessionDb = {
      sessionId,
      uid: user.uid,
      createdAt: AdminFirestore.Timestamp.fromMillis(now),
      expiresAt: AdminFirestore.Timestamp.fromMillis(expiresAtMs),
      ip,
      userAgent,
      isValid: true,
    };

    const cacheData: CachedSessionData = {
      userId: user.uid,
      user: {
        uid: user.uid,
        email: user.email,
        orgId: user.orgId,
        orgRole: user.orgRole,
        deletedAt: user.deletedAt,
      },
    };

    await sessionRepository.createSessionRecord(sessionData);
    // Store rich object in Redis
    await sessionCache.store(sessionId, JSON.stringify(cacheData), expiresAtMs);

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

      // Fetch full user to cache
      const user = await userRepository.getUserIncludeDeleted(uid);
      if (!user) throw new Error('User not found in database');

      if (emailVerified && !user.emailVerified) {
        userRepository.updateUser(uid, { emailVerified: true }).catch(console.error);
      }

      const sessionId = await this.persistSession(user, userAgent, ip);
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
