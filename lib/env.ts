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
  // Optional on client (undefined), Required on server (via getServerEnv)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),

  SESSION_COOKIE_NAME: z.string().default('__session'),
  SESSION_COOKIE_MAX_AGE_DAYS: z.coerce.number().min(1).default(5),

  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// 1. Explicitly construct the object.
const envVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,

  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE_DAYS: process.env.SESSION_COOKIE_MAX_AGE_DAYS,

  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

  NODE_ENV: process.env.NODE_ENV,
};

// 2. Validate the constructed object
const _env = envSchema.safeParse(envVars);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));

  // Throw only if Public keys are missing (prevents Client crash on missing Server keys)
  const missingPublic = _env.error.issues.some((i) => String(i.path[0]).startsWith('NEXT_PUBLIC'));
  if (missingPublic) {
    throw new Error('Missing required NEXT_PUBLIC environment variables.');
  }
}

export const env = _env.success ? _env.data : (envVars as any);

/**
 * STRICT Server-Side Environment Getter
 * Call this in your Admin/Server services to ensure keys exist.
 */
export const getServerEnv = () => {
  if (typeof window !== 'undefined') {
    throw new Error('❌ getServerEnv() was called on the client. This is a security risk.');
  }

  const data = env;

  if (!data.FIREBASE_PRIVATE_KEY || !data.FIREBASE_CLIENT_EMAIL || !data.FIREBASE_PROJECT_ID) {
    throw new Error('❌ Missing Server-Side Firebase Environment Variables');
  }

  return {
    ...data,
    // Robust replacement handling for both \\n (escaped in .env) and \n (actual newline)
    FIREBASE_PRIVATE_KEY: data.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
};

export const getPrivateKey = () => {
  return getServerEnv().FIREBASE_PRIVATE_KEY;
};
