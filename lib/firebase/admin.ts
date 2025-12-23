import * as admin from 'firebase-admin';
import 'server-only';
import { env, getPrivateKey } from '../env';
import { logInfo } from '../logger';

function initializeAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  // Use the explicit server-side variables
  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const storageBucket = env.FIREBASE_STORAGE_BUCKET;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: getPrivateKey(),
    }),
    storageBucket,
  });

  admin.firestore().settings({
    ignoreUndefinedProperties: true,
  });

  logInfo(`✅ Firebase Admin initialized: ${projectId}`);
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
