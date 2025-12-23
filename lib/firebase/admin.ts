import * as admin from 'firebase-admin';
import 'server-only';
import { env, getPrivateKey } from '../env';
import { logInfo } from '../logger';

function initializeAdmin() {
  if (admin.apps.length > 0) return;

  // Private key check specifically for Server context
  if (!env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Missing Admin SDK credentials');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  admin.firestore().settings({ ignoreUndefinedProperties: true });
  logInfo(`✅ Firebase Admin initialized: ${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
}

initializeAdmin();

export const firestore = () => admin.firestore();
export const auth = () => admin.auth();
export const storage = () => admin.storage();

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
