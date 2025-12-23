import { Redis } from '@upstash/redis';
import { env } from './env';

// Only initialize if keys are present to avoid crashing if you haven't set up Redis yet
export const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;
