// features/auth/services/session.service.ts
import { SESSION_PREFIX, SESSION_TTL_SECONDS } from '@/lib/constants';
import { redisClient } from '@/lib/redis';
import { Result } from '@/lib/types'; // Assuming standard Result type exists
import { AppErrorCode } from '@/lib/utils/errors';
import 'server-only';

export class SessionService {
  /**
   * 🔍 Validates if a session ID is currently active and not revoked.
   * Called by middleware on EVERY secure action.
   *
   * @param {string} userId - The unique identifier of the user.
   * @param {string} sessionId - The unique identifier of the session.
   * @returns {Promise<boolean>} True if the session exists and is valid, false otherwise.
   *
   * @example
   * const isValid = await SessionService.validateSession('user-123', 'session-abc');
   * if (!isValid) throw new Error('Session Expired');
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
   * Stores the session in Redis with a Time-To-Live (TTL).
   *
   * @param {string} userId - The ID of the user logging in.
   * @param {string} sessionId - The new session ID to register.
   * @returns {Promise<void>}
   *
   * @example
   * await SessionService.createSession('user-123', 'session-new-789');
   */
  static async createSession(userId: string, sessionId: string): Promise<void> {
    const key = `${SESSION_PREFIX}${userId}:${sessionId}`;
    await redisClient.set(key, 'true', { ex: SESSION_TTL_SECONDS });
  }

  /**
   * 🚫 Revokes a specific session (Sign Out).
   *
   * @param {string} userId - The user ID.
   * @param {string} sessionId - The session ID to remove.
   * @returns {Promise<void>}
   *
   * @example
   * await SessionService.revokeSession('user-123', 'session-old-456');
   */
  static async revokeSession(userId: string, sessionId: string): Promise<void> {
    const key = `${SESSION_PREFIX}${userId}:${sessionId}`;
    await redisClient.del(key);
  }

  /**
   * 💥 Revokes ALL sessions for a user (Security Event / Password Reset).
   * Scans for all keys matching the user prefix and deletes them.
   *
   * @param {string} userId - The ID of the user to sign out globally.
   * @returns {Promise<Result<void>>} A result object indicating success or failure.
   *
   * @example
   * const result = await SessionService.revokeAllUserSessions('user-123');
   * if (result.success) console.log('User signed out everywhere');
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
