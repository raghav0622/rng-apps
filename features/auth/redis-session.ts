import { redis } from '@/lib/redis';

const PREFIX = 'session:';

export const sessionCache = {
  /**
   * Stores a valid session in Redis with the exact TTL remaining.
   * @param value - The JSON stringified session data (or userId for legacy)
   */
  async store(sessionId: string, value: string, expiresAt: number | Date) {
    // Calculate remaining milliseconds
    const expiryMs = typeof expiresAt === 'number' ? expiresAt : expiresAt.getTime();
    const ttlSeconds = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));

    if (ttlSeconds > 0) {
      await redis.set(`${PREFIX}${sessionId}`, value, { ex: ttlSeconds });
    }
  },

  /**
   * Verifies if a session is valid.
   * Returns the stored value (JSON string) if valid, null if revoked/expired.
   */
  async verify(sessionId: string): Promise<string | null> {
    return await redis.get<string>(`${PREFIX}${sessionId}`);
  },

  /**
   * Extends the TTL of an existing session (Sliding Window).
   * @param ttlMs - Time in milliseconds to extend by
   */
  async extend(sessionId: string, ttlMs: number) {
    const ttlSeconds = Math.floor(ttlMs / 1000);
    if (ttlSeconds > 0) {
      await redis.expire(`${PREFIX}${sessionId}`, ttlSeconds);
    }
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
