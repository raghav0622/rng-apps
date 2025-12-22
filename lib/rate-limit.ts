import { AppErrorCode, CustomError } from '@/lib/errors';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

// Ensure you have UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env
const redis = Redis.fromEnv();

// Configuration: 5 attempts per 1 minute
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'rng_auth_limit',
});

export async function checkRateLimit() {
  // In development, you might want to bypass this or use a mock
  if (process.env.NODE_ENV === 'development') return;

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') ?? '127.0.0.1';

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    throw new CustomError(
      AppErrorCode.TOO_MANY_REQUESTS,
      'Too many attempts. Please try again later.',
    );
  }

  return { limit, remaining, reset };
}
