import { FirestoreRepository } from '@/lib/firestore-repository/firestore-repository';
import { Subscription, SubscriptionSchema } from './billing.model';

const COLLECTION_PATH = 'subscriptions';

class SubscriptionRepository extends FirestoreRepository<Subscription> {
  constructor() {
    super(COLLECTION_PATH, {
      schema: SubscriptionSchema,
      softDeleteEnabled: true,
    });
  }

  async getByOrgId(orgId: string): Promise<Subscription | null> {
    const { data } = await this.list({
      where: [{ field: 'orgId', op: '==', value: orgId }],
      limit: 1,
    });
    return data[0] || null;
  }
}

export const subscriptionRepository = new SubscriptionRepository();
