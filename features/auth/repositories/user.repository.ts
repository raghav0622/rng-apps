import { UserRoleInOrg } from '@/features/enums';
import { firestore } from '@/lib/firebase/admin';
import { serializeFirestoreData } from '@/lib/firebase/utils';
import { Result } from '@/lib/types';
import { CreateUserInDatabase, User } from '../auth.model';

export class UserRepository {
  private usersCollection = firestore().collection('users');

  async getUser(uid: string): Promise<User> {
    const doc = await this.usersCollection.doc(uid).get();
    if (!doc.exists) throw new Error('User not found');
    const user = doc.data() as User;
    if (user.deletedAt) throw new Error('Account is disabled');
    return serializeFirestoreData(user); // <--- FIX
  }

  async getUserIncludeDeleted(uid: string): Promise<User | null> {
    const doc = await this.usersCollection.doc(uid).get();
    return doc.exists ? serializeFirestoreData(doc.data() as User) : null; // <--- FIX
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const snap = await this.usersCollection.where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    return serializeFirestoreData(snap.docs[0].data() as User); // <--- FIX
  }

  async getUsersByOrg(orgId: string): Promise<User[]> {
    const snap = await this.usersCollection
      .where('orgId', '==', orgId)
      .where('deletedAt', '==', null)
      .get();

    return snap.docs.map((doc) => serializeFirestoreData(doc.data() as User)); // <--- FIX
  }

  async signUpUser(params: CreateUserInDatabase): Promise<Result<User>> {
    const userRef = this.usersCollection.doc(params.uid);
    return await firestore().runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (doc.exists) {
        return { success: true, data: serializeFirestoreData(doc.data() as User) };
      }

      const now = new Date(); // Use Date directly for new objects, Firestore handles conversion on save
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
        deletedAt: undefined,
      };

      t.set(userRef, userData);
      return { success: true, data: userData };
    });
  }

  async updateUser(uid: string, data: Partial<User>) {
    const cleanData = Object.entries(data).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    await this.usersCollection.doc(uid).update({
      ...cleanData,
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
