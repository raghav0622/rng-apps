import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { Result } from '@/lib/types'; // <--- Ensure Result is imported
import { v4 as uuidv4 } from 'uuid';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from './billing.model';
import { subscriptionRepository } from './subscription.repository';

class BillingService extends AbstractService {
  /**
   * Initializes a free trial for a new organization.
   * Called via Event Bus when 'org.created' event fires.
   */
  // 🛑 FIX: Return type must be Result<Subscription>
  async createTrial(orgId: string): Promise<Result<Subscription>> {
    return this.handleOperation('billing.createTrial', async () => {
      const now = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(now.getDate() + 14); // 14 Day Trial

      // repo.create returns the entity directly (Subscription)
      // handleOperation wraps it in { success: true, data: ... }
      const sub = await subscriptionRepository.create(uuidv4(), {
        orgId,
        status: SubscriptionStatus.TRIALING,
        planId: SubscriptionPlan.PRO,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
      });

      return sub;
    });
  }

  /**
   * Gets the current subscription for an org.
   * If none exists (legacy data), returns a dummy FREE plan object.
   */
  // 🛑 FIX: Return type must be Result<Subscription>
  async getSubscription(orgId: string): Promise<Result<Subscription>> {
    return this.handleOperation('billing.get', async () => {
      const sub = await subscriptionRepository.getByOrgId(orgId);

      if (sub) return sub;

      // Fallback for orgs created before billing existed
      return {
        id: 'virtual',
        orgId,
        status: SubscriptionStatus.ACTIVE,
        planId: SubscriptionPlan.FREE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().getFullYear() + 1, 0, 1),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as Subscription;
    });
  }
}

export const billingService = new BillingService();
