import { SESSION_PREFIX, SESSION_TTL_SECONDS } from '@/lib/constants';
import { redisClient as redis } from '@/lib/redis'; // Ensure this matches your redis export
import { Result } from '@/lib/types';
import { AppErrorCode } from '@/lib/utils/errors';
import 'server-only';

export class SessionService {
  /**
   * Validates if a session ID is currently active.
   */
  static async validateSession(userId: string, sessionId: string): Promise<boolean> {
    if (!userId || !sessionId) {
      console.warn('[Session] Validation failed: Missing userId or sessionId');
      return false;
    }

    const key = `${SESSION_PREFIX}${userId}:${sessionId}`;

    try {
      // 1. Check Redis
      // We use 'get' to inspect the value (useful for debugging)
      const value = await redis.get(key);

      if (!value) {
        console.warn(`[Session] Key not found: ${key}`);
        return false;
      }

      // 2. Refresh TTL (Optional: Slide expiry on activity)
      // await redis.expire(key, SESSION_TTL_SECONDS);

      return true; // Any value means it exists and is valid
    } catch (error) {
      console.error('[Session] Redis Error during validation:', error);
      // Fail closed for security
      return false;
    }
  }

  /**
   * Registers a new session upon login.
   */
  static async createSession(userId: string, sessionId: string): Promise<void> {
    const key = `${SESSION_PREFIX}${userId}:${sessionId}`;
    // Store 'true' or a timestamp. We prefer timestamp for debugging.
    await redis.set(key, new Date().toISOString(), { ex: SESSION_TTL_SECONDS });
  }

  /**
   * Revokes a specific session.
   */
  static async revokeSession(userId: string, sessionId: string): Promise<void> {
    const key = `${SESSION_PREFIX}${userId}:${sessionId}`;
    await redis.del(key);
  }

  /**
   * Revokes ALL sessions for a user.
   */
  static async revokeAllUserSessions(userId: string): Promise<Result<void>> {
    try {
      const pattern = `${SESSION_PREFIX}${userId}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('[Session] Revoke All Error:', error);
      return {
        success: false,
        error: { code: AppErrorCode.INTERNAL_ERROR, message: 'Failed to revoke sessions' },
      };
    }
  }
}
