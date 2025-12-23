import { AppErrorCode, CustomError } from '@/lib/errors';
import { Ratelimit } from '@upstash/ratelimit';
import { headers } from 'next/headers';
import { redis } from './redis';

// Helper to determine if we can actually rate limit
const isRateLimitEnabled = !!redis;

let ratelimit: Ratelimit | null = null;

if (isRateLimitEnabled) {
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'rng_auth_limit',
  });
} else {
  // Warn only once during server startup
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️  Upstash Redis credentials not found. Rate limiting is DISABLED in development.',
    );
  }
}

export async function checkRateLimit() {
  // 1. Bypass if disabled (e.g., no credentials in Dev)
  if (!ratelimit) {
    // In production, strictly require rate limiting to prevent abuse
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: Rate limiting is misconfigured in production!');
      // Fail open or closed? Failing closed is safer for security, but bad for UX.
      // For now, we allow it but log the critical error.
      return { limit: 100, remaining: 100, reset: Date.now() };
    }
    return { limit: 100, remaining: 100, reset: Date.now() };
  }

  // 2. Perform Rate Limit Check
  try {
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
  } catch (error) {
    if (error instanceof CustomError) throw error;

    // Fail Open: If Redis goes down, don't block users, but log the error
    console.error('Rate Limit Error (Fail Open):', error);
    return { limit: 10, remaining: 10, reset: Date.now() };
  }
}
