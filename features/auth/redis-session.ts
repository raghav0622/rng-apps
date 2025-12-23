import { SESSION_DURATION_MS } from '@/lib/cookie-utils';
import { redis } from '@/lib/redis';

export const sessionCache = {
  /**
   * Stores a valid session in Redis.
   * Call this immediately after verifying credentials in your Login action.
   */
  async store(sessionId: string, userId: string) {
    await redis.set(`session:${sessionId}`, userId, { ex: SESSION_DURATION_MS });
  },

  /**
   * Verifies if a session is valid.
   * Returns userId if valid, null if revoked/expired.
   */
  async verify(sessionId: string): Promise<string | null> {
    return await redis.get<string>(`session:${sessionId}`);
  },

  /**
   * Instantly revokes a session (Ban).
   */
  async revoke(sessionId: string) {
    await redis.del(`session:${sessionId}`);
  },
};
