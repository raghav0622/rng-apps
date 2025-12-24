import { redisClient } from '@/lib/redis';

/**
 * Retrieves a previously stored result for an idempotent key.
 *
 * @param {string} key - The unique idempotency key (e.g., "payment_txn_123").
 * @returns {Promise<any | null>} The cached data if found, otherwise null.
 */
export async function getIdempotencyRecord(key: string): Promise<any | null> {
  return await redisClient.get(`idemp:${key}`);
}

/**
 * Stores the result of an operation to prevent duplicate execution.
 *
 * @param {string} key - The unique idempotency key.
 * @param {any} data - The result data to cache.
 * @param {number} [ttl=3600] - Time to live in seconds (default 1 hour).
 */
export async function saveIdempotencyRecord(key: string, data: any, ttl = 3600) {
  // Store for 1 hour by default
  await redisClient.set(`idemp:${key}`, JSON.stringify(data), { ex: ttl });
}
