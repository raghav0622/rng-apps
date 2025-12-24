import { redisClient } from '@/lib/redis'; // Ensure this path matches your project
import { CacheProvider } from './types';

/**
 * Upstash Redis implementation of the CacheProvider interface.
 * Handles JSON serialization automatically via the Redis client.
 *
 * @example
 * const repo = new FirestoreRepository('users', { cacheProvider: upstashCache });
 */
export const upstashCache: CacheProvider = {
  /**
   * Retrieves a typed value from Redis.
   */
  get: async <T>(key: string) => {
    return await redisClient.get<T>(key);
  },
  /**
   * Sets a value in Redis with optional TTL.
   */
  set: async (key, value, ttl) => {
    if (ttl) await redisClient.set(key, value, { ex: ttl });
    else await redisClient.set(key, value);
  },
  /**
   * Deletes a key from Redis.
   */
  del: async (key) => {
    await redisClient.del(key);
  },
  /**
   * Set Not Exists (Locking pattern).
   */
  setNX: async (key, value, ttl) => {
    const res = await redisClient.set(key, value, { ex: ttl, nx: true });
    return res === 'OK';
  },
};
