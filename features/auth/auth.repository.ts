import { auth, firestore } from '@/lib/firebase/admin';
import 'server-only';

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalUpdates: Record<string, any> = {
        updatedAt: now,
        lastLoginAt: updates.lastLoginAt,
      };

      if (updates.displayName) {
        finalUpdates.displayName = updates.displayName;
      }

      await userRef.update(finalUpdates);
    }
  }

  /**
   * Fetch the latest user profile from Firestore.
   * This ensures we get the large Base64 photoURL that won't fit in a cookie.
   */
  async getUser(uid: string) {
    const snap = await this.usersCollection.doc(uid).get();
    if (!snap.exists) return null;

    const data = snap.data();
    return {
      uid: snap.id,
      email: data?.email ?? null,
      displayName: data?.displayName ?? null,
      photoURL: data?.photoURL ?? null,
      // Add other fields as needed
    };
  }

  async updateUser(uid: string, data: { displayName?: string; photoURL?: string | null }) {
    const userRef = this.usersCollection.doc(uid);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (data.displayName) updates.displayName = data.displayName;
    if (data.photoURL !== undefined) updates.photoURL = data.photoURL;
    await userRef.update(updates);
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
