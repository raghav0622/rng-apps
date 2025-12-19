import 'server-only';

import { auth, firestore } from '@/lib/firebase/admin';

export class AuthRepository {
  private usersCollection = firestore().collection('users');

  async verifyIdToken(idToken: string) {
    return auth().verifyIdToken(idToken);
  }

  async createSessionCookie(idToken: string, expiresIn: number) {
    return auth().createSessionCookie(idToken, { expiresIn });
  }

  async ensureUserExists(
    uid: string,
    defaults: {
      email: string;
      displayName?: string;
      photoURL?: string | null;
    },
    updates: {
      lastLoginAt: Date;
      displayName?: string;
    },
  ): Promise<void> {
    const userRef = this.usersCollection.doc(uid);
    const now = new Date();

    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      await userRef.set({
        email: defaults.email,
        displayName: updates.displayName || defaults.displayName || '',
        photoURL: defaults.photoURL || null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        lastLoginAt: updates.lastLoginAt,
      });
    } else {
      const finalUpdates: Record<string, any> = {
        updatedAt: now,
        lastLoginAt: updates.lastLoginAt,
      };

      const currentData = snapshot.data();

      // Sync Display Name: Use explicit update, OR fallback to token default if DB is different
      if (updates.displayName) {
        finalUpdates.displayName = updates.displayName;
      } else if (defaults.displayName && currentData?.displayName !== defaults.displayName) {
        finalUpdates.displayName = defaults.displayName;
      }

      // Sync Photo URL: If token has a photo and DB is different/missing, sync it.
      // This ensures Auth source-of-truth propagates to DB on login.
      if (defaults.photoURL !== undefined && currentData?.photoURL !== defaults.photoURL) {
        finalUpdates.photoURL = defaults.photoURL;
      }

      await userRef.update(finalUpdates);
    }
  }

  async getUser(uid: string) {
    const snap = await this.usersCollection.doc(uid).get();
    if (!snap.exists) return null;

    const data = snap.data();
    return {
      uid: snap.id,
      email: data?.email ?? null,
      displayName: data?.displayName ?? null,
      photoURL: data?.photoURL ?? null,
    };
  }

  async updateUser(uid: string, data: { displayName?: string; photoURL?: string | null }) {
    const userRef = this.usersCollection.doc(uid);

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (data.displayName) updates.displayName = data.displayName;
    if (data.photoURL !== undefined) updates.photoURL = data.photoURL;
    await userRef.update(updates);
  }

  /**
   * Updates the Firebase Auth user record.
   * This ensures the next time an ID token is minted, it contains the new name/photo.
   */
  async updateAuthUser(uid: string, data: { displayName: string; photoURL?: string | null }) {
    await auth().updateUser(uid, {
      displayName: data.displayName,
      photoURL: data.photoURL || null,
    });
  }

  async deleteFirestoreUser(uid: string) {
    await this.usersCollection.doc(uid).delete();
  }

  async deleteAuthUser(uid: string) {
    await auth().deleteUser(uid);
  }

  async verifySessionCookie(sessionCookie: string) {
    return auth().verifySessionCookie(sessionCookie, true);
  }
}

export const authRepository = new AuthRepository();
