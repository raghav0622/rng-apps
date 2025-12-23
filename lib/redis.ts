import { Redis } from '@upstash/redis';
import { env } from './env';

/**
 * Server-side Redis client for Upstash.
 * Uses HTTP/REST, making it perfect for Edge/Serverless environments.
 */
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});
