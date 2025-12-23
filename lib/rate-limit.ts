import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

// Fix: Allow 50 requests every 30 seconds (Approx 1.6 req/sec sustained)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, '30 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

export async function checkRateLimit() {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') ?? '127.0.0.1';

  const { success } = await ratelimit.limit(ip);

  if (!success) {
    throw new Error('Too many attempts. Please try again later.');
  }
}
