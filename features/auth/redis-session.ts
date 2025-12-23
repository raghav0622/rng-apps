import { redis } from '@/lib/redis';

const PREFIX = 'session:';

export const sessionCache = {
  /**
   * Stores a valid session in Redis with the exact TTL remaining.
   */
  async store(sessionId: string, userId: string, expiresAt: number | Date) {
    // Calculate remaining milliseconds
    const expiryMs = typeof expiresAt === 'number' ? expiresAt : expiresAt.getTime();
    const ttlSeconds = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));

    if (ttlSeconds > 0) {
      await redis.set(`${PREFIX}${sessionId}`, userId, { ex: ttlSeconds });
    }
  },

  /**
   * Verifies if a session is valid.
   * Returns userId if valid, null if revoked/expired.
   */
  async verify(sessionId: string): Promise<string | null> {
    return await redis.get<string>(`${PREFIX}${sessionId}`);
  },

  /**
   * Instantly revokes a session (Ban).
   */
  async revoke(sessionId: string) {
    await redis.del(`${PREFIX}${sessionId}`);
  },

  /**
   * Bulk revoke utility for revoking all user sessions
   */
  async revokeMultiple(sessionIds: string[]) {
    if (sessionIds.length === 0) return;
    const keys = sessionIds.map((id) => `${PREFIX}${id}`);
    await redis.del(...keys);
  },
};
