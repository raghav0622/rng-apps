import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from './billing.model';
import { subscriptionRepository } from './subscription.repository';

class BillingService extends AbstractService {
  /**
   * Initializes a free trial for a new organization.
   * idempotent: checks if subscription exists first.
   */
  async createTrial(orgId: string): Promise<Result<Subscription>> {
    return this.handleOperation('billing.createTrial', async () => {
      // 1. Idempotency Check
      const existing = await subscriptionRepository.getByOrgId(orgId);
      if (existing) return existing;

      const now = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(now.getDate() + 14); // 14 Day Trial

      // 2. Create Record
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
   * Returns a "Virtual" Free Tier subscription if no record exists.
   */
  async getSubscription(orgId: string): Promise<Result<Subscription>> {
    return this.handleOperation('billing.get', async () => {
      const sub = await subscriptionRepository.getByOrgId(orgId);

      if (sub) return sub;

      // Virtual Fallback (Free Tier)
      return {
        id: 'virtual-free-tier',
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

  /**
   * Upgrade/Downgrade Plan (Placeholder for Stripe Integration)
   */
  async changePlan(orgId: string, planId: SubscriptionPlan): Promise<Result<void>> {
    return this.handleOperation('billing.changePlan', async () => {
      const sub = await subscriptionRepository.getByOrgId(orgId);
      if (!sub) throw new CustomError(AppErrorCode.NOT_FOUND, 'No subscription found to upgrade.');

      // In a real app, this would trigger a Stripe Checkout Session or Update Subscription API
      await subscriptionRepository.update(sub.id, {
        planId,
        updatedAt: new Date(),
      });
    });
  }
}

export const billingService = new BillingService();
