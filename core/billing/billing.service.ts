import { organizationRepository } from '@/core/organization/organization.repository';
import { NotificationTopic, NotificationType } from '@/core/notifications/notification.model';
import { notificationService } from '@/core/notifications/notification.service';
import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from './billing.model';
import { subscriptionRepository } from './subscription.repository';

// MOCK STRIPE IDS (Replace with Env Vars in Prod)
const PLAN_PRICE_IDS = {
  [SubscriptionPlan.FREE]: 'price_free_tier_id',
  [SubscriptionPlan.PRO]: 'price_pro_monthly_id',
  [SubscriptionPlan.ENTERPRISE]: 'price_ent_contact_us',
};

class BillingService extends AbstractService {
  /**
   * Initializes a PERMANENT FREE TIER for a new organization.
   * Limits: 5 Seats. No Expiry.
   */
  async initializeFreeTier(orgId: string, transaction?: FirebaseFirestore.Transaction): Promise<Result<Subscription>> {
    return this.handleOperation('billing.initializeFreeTier', async () => {
      const repo = transaction ? subscriptionRepository.withTransaction(transaction) : subscriptionRepository;

      // 1. Idempotency Check
      const existing = await repo.getByOrgId(orgId);
      if (existing) return existing;

      const now = new Date();
      // Free Tier theoretically lasts forever (100 years)
      const foreverEnd = new Date();
      foreverEnd.setFullYear(foreverEnd.getFullYear() + 100);

      // 2. Create Record (Status: ACTIVE, Plan: FREE)
      const sub = await repo.create(uuidv4(), {
        orgId,
        status: SubscriptionStatus.ACTIVE, // Permanently Active
        planId: SubscriptionPlan.FREE,
        seats: 5, // Strict Seat Limit
        currentPeriodStart: now,
        currentPeriodEnd: foreverEnd,
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
        seats: 5,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().getFullYear() + 100, 0, 1),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as Subscription;
    });
  }

  /**
   * Generates a Stripe Checkout URL for upgrading/changing plans.
   */
  async createCheckoutSession(
    orgId: string,
    userId: string,
    planId: SubscriptionPlan,
  ): Promise<Result<{ url: string }>> {
    return this.handleOperation('billing.checkout', async () => {
      // 1. Validate Plan
      if (planId === SubscriptionPlan.FREE) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Cannot checkout for free plan.');
      }

      // 2. Mock Stripe Interaction
      // In prod: const session = await stripe.checkout.sessions.create(...)
      const mockUrl = `https://checkout.stripe.com/pay/${PLAN_PRICE_IDS[planId]}?client_reference_id=${orgId}`;

      console.log('---------------------------------------------------');
      console.log(`[MOCK STRIPE] Checkout URL generated for ${orgId} -> ${planId}`);
      console.log(mockUrl);
      console.log('---------------------------------------------------');

      return { url: mockUrl };
    });
  }

  /**
   * Generates a Customer Portal URL for managing billing.
   */
  async createPortalSession(orgId: string): Promise<Result<{ url: string }>> {
    return this.handleOperation('billing.portal', async () => {
      const sub = await subscriptionRepository.getByOrgId(orgId);
      if (!sub || !sub.customerId) {
        throw new CustomError(
          AppErrorCode.NOT_FOUND,
          'No billing account found. Please upgrade first.',
        );
      }

      // In prod: const session = await stripe.billingPortal.sessions.create(...)
      const mockUrl = `https://billing.stripe.com/p/login/${sub.customerId}`;

      return { url: mockUrl };
    });
  }

  /**
   * Webhook Handler: Invoice Payment Failed
   */
  async handlePaymentFailed(subscriptionId: string): Promise<Result<void>> {
    return this.handleOperation('billing.webhook.failed', async () => {
      const sub = await subscriptionRepository.getBySubscriptionId(subscriptionId);
      if (!sub) return;

      await subscriptionRepository.update(sub.id, {
        status: SubscriptionStatus.PAST_DUE,
      });

      // 🔔 Notify Org Owner
      const org = await organizationRepository.get(sub.orgId);
      if (org) {
        await notificationService.send(org.ownerId, {
          topic: NotificationTopic.BILLING,
          type: NotificationType.ERROR,
          title: 'Payment Failed',
          message: 'Your latest invoice payment failed. Please update your payment method.',
          link: '/billing',
          orgId: sub.orgId,
        });
      }
    });
  }

  /**
   * Webhook Handler: Subscription Updated/Deleted
   */
  async handleSubscriptionSync(stripeSub: any): Promise<Result<void>> {
    return this.handleOperation('billing.webhook.sync', async () => {
      const sub = await subscriptionRepository.getBySubscriptionId(stripeSub.id);
      
      // If we don't have it, we might need to find by Customer ID or create it?
      // For simplicity, we assume we tracked the ID during checkout success.
      if (!sub) return;

      await subscriptionRepository.update(sub.id, {
        status: stripeSub.status,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      });
    });
  }
}

export const billingService = new BillingService();
