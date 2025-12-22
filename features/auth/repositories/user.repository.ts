import { UserRoleInOrg } from '@/features/enums';
import { firestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { CreateUserInDatabase, User } from '../auth.model';

export class UserRepository {
  private usersCollection = firestore().collection('users');

  async getUser(uid: string): Promise<User> {
    const doc = await this.usersCollection.doc(uid).get();
    if (!doc.exists) throw new Error('User not found');
    return doc.data() as User;
  }

  async getUserByEmail(email: string): Promise<User> {
    const snap = await this.usersCollection.where('email', '==', email).limit(1).get();
    if (snap.empty) throw new Error('User Profile not found');
    return snap.docs[0].data() as User;
  }

  async signUpUser(params: CreateUserInDatabase): Promise<Result<User>> {
    const userRef = this.usersCollection.doc(params.uid);
    const now = new Date();
    const snapshot = await userRef.get();

    if (snapshot.exists) {
      return { success: true, data: snapshot.data() as User };
    }

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

    await userRef.set(userData);
    return { success: true, data: userData };
  }

  async updateUser(uid: string, data: Partial<User>) {
    await this.usersCollection.doc(uid).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  async deleteUser(uid: string) {
    try {
      await this.usersCollection.doc(uid).delete();
    } catch (e) {
      console.warn('Failed to delete user doc', e);
    }
  }
}

export const userRepository = new UserRepository();
