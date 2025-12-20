import 'server-only';

import { auth, firestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { UserRoleInOrg } from '../enums';
import { CreateUserInDatabase, User } from './auth.model';

export class AuthRepository {
  private usersCollection = firestore().collection('users');

  async verifyIdToken(idToken: string) {
    return auth().verifyIdToken(idToken);
  }

  async createSessionCookie(idToken: string, expiresIn: number) {
    return auth().createSessionCookie(idToken, { expiresIn });
  }

  async signUpUser(params: CreateUserInDatabase): Promise<Result<User>> {
    const userRef = this.usersCollection.doc(params.uid);
    const now = new Date();

    const snapshot = await userRef.get();

    if (snapshot.exists) {
      throw new Error('User already exists');
    } else {
      const userData: User = {
        createdAt: now,
        updatedAt: now,
        displayName: params.displayName,
        photoUrl: '',
        email: params.email,
        emailVerified: false,
        onboarded: false,
        orgRole: UserRoleInOrg.NOT_IN_ORG,
        uid: params.uid,
        orgId: undefined,
        lastLoginAt: now,
        deletedAt: undefined,
      };

      await userRef.set(userData as User);

      return {
        success: true,
        data: userData,
      };
    }
  }

  async getUserByEmail(email: string) {
    const snap = await this.usersCollection.where('email', '==', email).get();
    if (snap.empty) throw new Error('User Profile not found');

    const data = snap.docs[0].data() as User;

    return data;
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
      // ADDED: Needed for Org Context checks
      orgId: (data?.orgId as string) ?? null,
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
