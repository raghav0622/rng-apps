import { User } from '@/features/auth/auth.model';
import { firestore } from '@/lib/firebase/admin';
import { serializeFirestoreData } from '@/lib/firebase/utils';
import 'server-only';

const COLLECTION = 'users';

export const memberRepository = {
  /**
   * Retrieves all users that belong to a specific organization.
   */
  async getMembers(orgId: string): Promise<User[]> {
    const snapshot = await firestore()
      .collection(COLLECTION)
      .where('orgId', '==', orgId)
      .orderBy('createdAt', 'desc')
      .get();

    return serializeFirestoreData(snapshot.docs.map((d) => d.data() as User));
  },

  /**
   * Retrieves a specific member, ensuring they belong to the given org.
   */
  async getMemberInOrg(orgId: string, userId: string): Promise<User | null> {
    const snapshot = await firestore().collection(COLLECTION).doc(userId).get();
    if (!snapshot.exists) return null;

    const user = snapshot.data() as User;
    if (user.orgId !== orgId) return null;

    return serializeFirestoreData(user);
  },
};
