import { AbstractService } from '../abstract-service/AbstractService';
import { Result } from '../types';
import { SubscriptionPlan } from '@/core/billing/billing.model';

export interface CheckoutSessionInput {
  orgId: string;
  userId: string;
  planId: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
}

export interface PortalSessionInput {
  customerId: string;
  returnUrl: string;
}

export interface PaymentProviderResult {
  url: string;
  sessionId?: string;
}

/**
 * 💳 Abstract Payment Provider
 * Decouples the billing logic from specific vendors (Stripe, LemonSqueezy, Paddle).
 */
export abstract class AbstractPaymentProvider extends AbstractService {
  /**
   * Generates a URL for the user to complete a purchase/upgrade.
   */
  abstract createCheckoutSession(input: CheckoutSessionInput): Promise<PaymentProviderResult>;

  /**
   * Generates a URL for the user to manage their subscription/cards.
   */
  abstract createPortalSession(input: PortalSessionInput): Promise<PaymentProviderResult>;

  /**
   * Validates a webhook signature.
   */
  abstract verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean>;

  /**
   * Normalizes vendor-specific events into domain events.
   */
  abstract parseWebhookEvent(body: any): {
    type: 'payment_failed' | 'subscription_updated' | 'subscription_deleted';
    subscriptionId: string;
    customerId?: string;
    data: any;
  };
}
