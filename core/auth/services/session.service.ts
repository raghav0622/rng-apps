// features/auth/services/session.service.ts
import { SESSION_PREFIX, SESSION_TTL_SECONDS } from '@/lib/constants';
import { redisClient } from '@/lib/redis';
import { Result } from '@/lib/types'; // Assuming standard Result type exists
import { AppErrorCode } from '@/lib/utils/errors';
import 'server-only';

// Constants for Session Management

export class SessionService {
  /**
   * 🔍 Validates if a session ID is currently active and not revoked.
   * Called by middleware on EVERY secure action.
   */
  static async validateSession(userId: string, sessionId: string): Promise<boolean> {
    if (!userId || !sessionId) return false;

    try {
      // 1. Check Redis whitelist
      const key = `${SESSION_PREFIX}${userId}:${sessionId}`;
      const isValid = await redisClient.get(key);

      return isValid === 'true';
    } catch (error) {
      // Fail open or closed?
      // For high security, we should fail closed, but if Redis blips, we might annoy users.
      // Current: Fail closed (User must re-login)
      console.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * ✨ Registers a new session upon login.
   */
  static async createSession(userId: string, sessionId: string): Promise<void> {
    const key = `${SESSION_PREFIX}${userId}:${sessionId}`;
    await redisClient.set(key, 'true', { ex: SESSION_TTL_SECONDS });
  }

  /**
   * 🚫 Revokes a specific session (Sign Out).
   */
  static async revokeSession(userId: string, sessionId: string): Promise<void> {
    const key = `${SESSION_PREFIX}${userId}:${sessionId}`;
    await redisClient.del(key);
  }

  /**
   * 💥 Revokes ALL sessions for a user (Security Event / Password Reset).
   */
  static async revokeAllUserSessions(userId: string): Promise<Result<void>> {
    try {
      // Scan for all keys belonging to user
      const pattern = `${SESSION_PREFIX}${userId}:*`;
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        await redisClient.del(...keys);
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
