import { FirestoreRepository } from '@/lib/firestore-repository/firestore-repository';
import { upstashCache } from '@/lib/firestore-repository/redis-adapter';
import { cache } from 'react';
import { User, UserSchema } from './auth.model';

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
   * Fetch user including soft-deleted ones (for Auth checks).
   */
  async getUserIncludeDeleted(uid: string): Promise<User | null> {
    try {
      return await this.get(uid, { includeDeleted: true });
    } catch (e) {
      return null;
    }
  }

  /**
   * Find a user by email.
   * Standardized to return null if not found instead of throwing,
   * to avoid tripping circuit breakers on common lookups.
   */
  async getByEmail(email: string): Promise<User | null> {
    const { data } = await this.list({
      where: [{ field: 'email', op: '==', value: email }],
      limit: 1,
    });

    return data[0] || null;
  }
}

export const userRepository = new UserRepository();

export const getUserCached = cache(async (uid: string) => {
  return await userRepository.get(uid);
});
