import { z } from 'zod';

const envSchema = z.object({
  // --- Client Side (Public) ---
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),

  // --- Server Side (Private) ---
  // Firebase Admin
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_STORAGE_BUCKET: z.string().min(1),

  // Session Settings
  SESSION_COOKIE_NAME: z.string().default('__session'),
  SESSION_COOKIE_MAX_AGE_DAYS: z.coerce.number().min(1).default(5),

  // Redis (Upstash)
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Parse process.env
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables. Check your .env file.');
}

export const env = _env.data;

/**
 * Helper to get the private key properly formatted for Firebase Admin.
 * Handles the "\n" line breaks from the .env string.
 */
export const getPrivateKey = () => {
  return env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
};
