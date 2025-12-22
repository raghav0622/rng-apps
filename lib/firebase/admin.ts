import * as admin from 'firebase-admin';
import 'server-only';
import { logInfo } from '../logger';

function initializeAdmin() {
  // Prevent re-initialization if app already exists
  if (admin.apps.length > 0) {
    return;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // 1. DETERMINE STORAGE BUCKET
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (projectId ? `${projectId}.firebasestorage.app` : undefined);

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [];
    if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

    throw new Error(
      `Firebase Admin Init Failed: Missing environment variables: ${missing.join(', ')}. ` +
        `Please check your .env.local file.`,
    );
  }

  // FIX: Robust handling for newlines and surrounding quotes often found in Vercel/Env files
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n').replace(/"/g, '');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    }),
    storageBucket: storageBucket,
  });

  admin.firestore().settings({
    ignoreUndefinedProperties: true,
  });

  logInfo(`✅ Firebase Admin initialized for project: ${projectId}`);
  if (storageBucket) {
    logInfo(`wm Storage Bucket configured: ${storageBucket}`);
  } else {
    console.warn('⚠️ No Storage Bucket configured. File uploads may fail.');
  }
}

// Initialize immediately
initializeAdmin();

export const firestore = () => {
  if (!admin.apps.length) initializeAdmin();
  return admin.firestore();
};

export const auth = () => {
  if (!admin.apps.length) initializeAdmin();
  return admin.auth();
};

export const storage = () => {
  if (!admin.apps.length) initializeAdmin();
  return admin.storage();
};

// Re-export specific types
export type Timestamp = admin.firestore.Timestamp;
export type WriteBatch = admin.firestore.WriteBatch;
export type Transaction = admin.firestore.Transaction;
export type Query<T> = admin.firestore.Query<T>;
export type DocumentReference<T> = admin.firestore.DocumentReference<T>;
export type CollectionReference<T> = admin.firestore.CollectionReference<T>;
export type DocumentSnapshot<T> = admin.firestore.DocumentSnapshot<T>;
export type WithFieldValue<T> = admin.firestore.WithFieldValue<T>;
export type UpdateData<T> = admin.firestore.UpdateData<T>;

export const AdminFirestore = {
  Timestamp: admin.firestore.Timestamp,
  FieldValue: admin.firestore.FieldValue,
};
