import * as admin from 'firebase-admin';
import 'server-only';
import { logInfo } from '../logger';

interface AdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  storageBucket: string;
}

const validateEnv = (): AdminConfig => {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (projectId ? `${projectId}.firebasestorage.app` : '');

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

  return {
    projectId,
    clientEmail,
    // Robust handling for newlines and surrounding quotes
    privateKey: privateKey.replace(/\\n/g, '\n').replace(/"/g, ''),
    storageBucket,
  };
};

function initializeAdmin() {
  // Prevent re-initialization if app already exists
  if (admin.apps.length > 0) {
    return;
  }

  const config = validateEnv();

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
    storageBucket: config.storageBucket,
  });

  admin.firestore().settings({
    ignoreUndefinedProperties: true,
  });

  logInfo(`✅ Firebase Admin initialized for project: ${config.projectId}`);

  if (config.storageBucket) {
    logInfo(`wm Storage Bucket configured: ${config.storageBucket}`);
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
