import { redisClient } from '@/lib/redis';

export async function getIdempotencyRecord(key: string): Promise<any | null> {
  return await redisClient.get(`idemp:${key}`);
}

export async function saveIdempotencyRecord(key: string, data: any, ttl = 3600) {
  // Store for 1 hour by default
  await redisClient.set(`idemp:${key}`, JSON.stringify(data), { ex: ttl });
}
