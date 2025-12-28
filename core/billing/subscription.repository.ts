import { AbstractFirestoreRepository } from '@/core/abstract-firestore-repository/abstract-firestore-repository';
import { Subscription, SubscriptionSchema } from './billing.model';

const COLLECTION_PATH = 'subscriptions';

class SubscriptionRepository extends AbstractFirestoreRepository<Subscription> {
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

  async getBySubscriptionId(subId: string): Promise<Subscription | null> {
    const { data } = await this.list({
      where: [{ field: 'subscriptionId', op: '==', value: subId }],
      limit: 1,
    });
    return data[0] || null;
  }
}

export const subscriptionRepository = new SubscriptionRepository();
