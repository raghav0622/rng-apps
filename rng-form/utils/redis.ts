import { env } from '@/lib/env';
import { Redis } from '@upstash/redis';

const redisUrl = env.UPSTASH_REDIS_REST_URL;
const redisToken = env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error(
    '❌ MISSING UPSTASH REDIS KEYS: Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment variables.',
  );
}

export const redisClient = new Redis({
  url: redisUrl,
  token: redisToken,
});
