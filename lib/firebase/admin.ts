import { logInfo } from '@/lib/logger';
import * as admin from 'firebase-admin';
import 'server-only';
import { getServerEnv } from '../env';

function initializeAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  // 1. Get Strict Server Environment
  // This will throw if keys are missing, which is what we want on the SERVER.
  const serverEnv = getServerEnv();

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serverEnv.FIREBASE_PROJECT_ID,
      clientEmail: serverEnv.FIREBASE_CLIENT_EMAIL,
      privateKey: serverEnv.FIREBASE_PRIVATE_KEY, // Already formatted by getServerEnv
    }),
    storageBucket: serverEnv.FIREBASE_STORAGE_BUCKET,
  });

  admin.firestore().settings({
    ignoreUndefinedProperties: true,
  });

  logInfo(`✅ Firebase Admin initialized: ${serverEnv.FIREBASE_PROJECT_ID}`);
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

export const AdminFirestore = {
  Timestamp: admin.firestore.Timestamp,
  FieldValue: admin.firestore.FieldValue,
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
