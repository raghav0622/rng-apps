// features/auth/repositories/user.repository.ts
import { FirestoreRepository } from '@/core/lib/firestore-repository/firestore-repository';
import { upstashCache } from '@/core/lib/firestore-repository/redis-adapter';
import { cache } from 'react'; // React cache for request deduping
import { User, UserSchema } from '../auth.model';

const COLLECTION_PATH = 'users';

class UserRepository extends FirestoreRepository<User> {
  constructor() {
    super(COLLECTION_PATH, {
      schema: UserSchema,
      sensitiveFields: [],
      softDeleteEnabled: true,
      enableVersioning: true,
      cacheProvider: upstashCache,
    });
  }

  /**
   * Specialized fetch that bypasses the default "exclude deleted" filter
   * strictly for Auth Middleware checks (we need to know if a user is disabled).
   */
  async getUserIncludeDeleted(uid: string): Promise<User | null> {
    return await this.get(uid, { includeDeleted: true });
  }

  /**
   * Find a user by email (useful for invites/admin tools).
   * Note: Firestore doesn't enforce unique emails automatically,
   * but Firebase Auth does.
   */
  async getByEmail(email: string): Promise<User | null> {
    const { data } = await this.list({
      where: [{ field: 'email', op: '==', value: email }],
      limit: 1,
    });
    return data[0] || null;
  }
}

// Singleton instance
export const userRepository = new UserRepository();

// React Cache wrapper for use within Server Components (RSC)
// to prevent multiple DB hits in the same render pass.
export const getUserCached = cache(async (uid: string) => {
  return await userRepository.get(uid);
});
