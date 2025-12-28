import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME, SESSION_PREFIX, SESSION_TTL_SECONDS } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { redisClient as redis } from '@/lib/redis';
import { Result } from '@/lib/types';
import { AppErrorCode } from '@/lib/utils/errors';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import 'server-only';
import { UAParser } from 'ua-parser-js';
import { userRepository } from './user.repository';
import { organizationRepository } from '../organization/organization.repository';
import { UserRoleInOrg } from '@/lib/action-policies';

export interface SessionData {
  sessionId: string;
  createdAt: string;
  ip?: string;
  device?: string;
  browser?: string;
  os?: string;
  isCurrent?: boolean;
}

export class SessionService {
  /**
   * 🛡️ Server-Side Session Helper
   * Gets the current session from cookies and verifies it.
   * Also checks Redis to see if the session has been revoked.
   */
  static async getServerSession() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
    const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

    if (!sessionCookie || !sessionId) return null;

    try {
      // 1. Verify Firebase Session Cookie
      const decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
      
      // 2. Verify Redis Session Exists (Revocation Check)
      const isValid = await this.validateSession(decodedClaims.uid, sessionId);
      if (!isValid) {
        return null;
      }

      return { ...decodedClaims, sessionId };
    } catch (error) {
      console.error('[SessionService] Verification failed:', error);
      return null;
    }
  }

  /**
   * 🛡️ Server-Side Required Session
   */
  static async requireServerSession() {
    const session = await this.getServerSession();
    if (!session) {
      const cookieStore = await cookies();
      cookieStore.delete(AUTH_SESSION_COOKIE_NAME);
      cookieStore.delete(SESSION_ID_COOKIE_NAME);
      redirect('/login');
    }
    return session;
  }

  /**
   * 🛡️ Requirement: Full User Profile & Org Context
   * Fetches user data and validates organization status.
   */
  static async requireUserAndOrg({ strictOrg = true } = {}) {
    const session = await this.requireServerSession();
    const user = await userRepository.get(session.uid);
    
    if (!user) {
      redirect('/login');
    }

    if (strictOrg) {
      if (!user.orgId || user.orgRole === UserRoleInOrg.NOT_IN_ORG || user.isOnboarded === false) {
        redirect('/onboarding');
      }

      const org = await organizationRepository.get(user.orgId);
      if (!org) {
        redirect('/onboarding');
      }

      return { user, org };
    }

    return { user, org: null };
  }

  /**
   * Registers a new session upon login with Metadata (User Agent, IP).
   */
  static async createSession(
    userId: string,
    sessionId: string,
    userAgent?: string,
    ip?: string,
  ): Promise<void> {
    const key = `${SESSION_PREFIX}${userId}:${sessionId}`;

    const ua = new UAParser(userAgent || '');
    const metadata = {
      createdAt: new Date().toISOString(),
      ip: ip || 'Unknown',
      browser: ua.getBrowser().name,
      os: ua.getOS().name,
      device: ua.getDevice().model || 'Desktop',
    };

    await redis.set(key, JSON.stringify(metadata), { ex: SESSION_TTL_SECONDS });
  }

  /**
   * Validates if a session ID is currently active in Redis.
   */
  static async validateSession(userId: string, sessionId: string): Promise<boolean> {
    if (!userId || !sessionId) return false;
    const key = `${SESSION_PREFIX}${userId}:${sessionId}`;
    const exists = await redis.exists(key);
    return exists === 1;
  }

  /**
   * List all active sessions for a user.
   */
  static async listSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<Result<SessionData[]>> {
    try {
      const pattern = `${SESSION_PREFIX}${userId}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length === 0) return { success: true, data: [] };

      const values = await redis.mget<string[]>(...keys);

      const sessions: SessionData[] = keys.map((key, index) => {
        // key format: session:valid:userId:sessionId
        // With SESSION_PREFIX = 'session:valid:'
        // Split by ':' gives: ['session', 'valid', userId, sessionId]
        const parts = key.split(':');
        const sessionId = parts[parts.length - 1]; 
        
        const rawData = values[index];
        let metadata = { createdAt: new Date().toISOString() };

        if (rawData) {
          try {
            if (rawData.startsWith('{')) {
              metadata = JSON.parse(rawData);
            } else {
              metadata = { ...metadata, createdAt: rawData };
            }
          } catch (e) {
            // ignore
          }
        }

        return {
          sessionId,
          isCurrent: sessionId === currentSessionId,
          ...metadata,
        };
      });

      sessions.sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return { success: true, data: sessions };
    } catch (error) {
      console.error('[Session] List Error:', error);
      return {
        success: false,
        error: { code: AppErrorCode.INTERNAL_ERROR, message: 'Failed to list sessions' },
      };
    }
  }

  /**
   * Revokes a specific session.
   */
  static async revokeSession(userId: string, sessionId: string): Promise<Result<void>> {
    const key = `${SESSION_PREFIX}${userId}:${sessionId}`;
    await redis.del(key);
    return { success: true, data: undefined };
  }

  /**
   * Revokes ALL sessions for a user except the current one.
   */
  static async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<Result<void>> {
    try {
      const pattern = `${SESSION_PREFIX}${userId}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        const keysToDelete = exceptSessionId
          ? keys.filter((k) => !k.endsWith(exceptSessionId))
          : keys;

        if (keysToDelete.length > 0) {
          await redis.del(...keysToDelete);
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: { code: AppErrorCode.INTERNAL_ERROR, message: 'Failed to revoke sessions' },
      };
    }
  }
}
