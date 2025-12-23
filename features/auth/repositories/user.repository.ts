import { UserRoleInOrg } from '@/features/enums';
import { firestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { CreateUserInDatabase, User } from '../auth.model';

export class UserRepository {
  private usersCollection = firestore().collection('users');

  async getUser(uid: string): Promise<User> {
    const doc = await this.usersCollection.doc(uid).get();
    if (!doc.exists) throw new Error('User not found');
    const user = doc.data() as User;
    if (user.deletedAt) throw new Error('Account is disabled');
    return user;
  }

  // Used for internal checks where we might need to know if a deleted user exists
  async getUserIncludeDeleted(uid: string): Promise<User | null> {
    const doc = await this.usersCollection.doc(uid).get();
    return doc.exists ? (doc.data() as User) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const snap = await this.usersCollection.where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    return snap.docs[0].data() as User;
  }

  async signUpUser(params: CreateUserInDatabase): Promise<Result<User>> {
    const userRef = this.usersCollection.doc(params.uid);

    // Use a transaction to ensure we don't overwrite an existing profile accidentally
    return await firestore().runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (doc.exists) {
        return { success: true, data: doc.data() as User };
      }

      const now = new Date();
      const userData: User = {
        uid: params.uid,
        email: params.email,
        displayName: params.displayName,
        photoUrl: '',
        emailVerified: false,
        onboarded: false,
        orgRole: UserRoleInOrg.NOT_IN_ORG,
        orgId: undefined,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        deletedAt: undefined, // undefined or null
      };

      t.set(userRef, userData);
      return { success: true, data: userData };
    });
  }

  async updateUser(uid: string, data: Partial<User>) {
    await this.usersCollection.doc(uid).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  // The "Soft" Delete
  async softDeleteUser(uid: string) {
    await this.usersCollection.doc(uid).update({
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // The "Hard" Delete (for Rollbacks or GDPR Purges)
  async forceDeleteUser(uid: string) {
    try {
      await this.usersCollection.doc(uid).delete();
    } catch (e) {
      console.warn('Failed to force delete user doc', e);
      throw e;
    }
  }
}

export const userRepository = new UserRepository();
