import { SubscriptionPlan } from '@/core/billing/billing.model';
import {
  AbstractPaymentProvider,
  CheckoutSessionInput,
  PaymentProviderResult,
  PortalSessionInput,
} from '../abstract-payment-provider/AbstractPaymentProvider';
import { Result } from '../types';

// MOCK STRIPE IDS (Replace with Env Vars in Prod)
const PLAN_PRICE_IDS = {
  [SubscriptionPlan.FREE]: 'price_free_tier_id',
  [SubscriptionPlan.PRO]: 'price_pro_monthly_id',
  [SubscriptionPlan.ENTERPRISE]: 'price_ent_contact_us',
};

export class MockPaymentProvider extends AbstractPaymentProvider {
  protected async sendInternal(payload: any): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<PaymentProviderResult> {
    const mockUrl = `https://checkout.stripe.com/pay/${PLAN_PRICE_IDS[input.planId]}?client_reference_id=${input.orgId}`;
    console.log('[MOCK PAYMENT] Checkout URL:', mockUrl);
    return { url: mockUrl };
  }

  async createPortalSession(input: PortalSessionInput): Promise<PaymentProviderResult> {
    const mockUrl = `https://billing.stripe.com/p/login/${input.customerId}`;
    return { url: mockUrl };
  }

  async verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
    return true; // Mock verification
  }

  parseWebhookEvent(body: any): {
    type: 'payment_failed' | 'subscription_updated' | 'subscription_deleted';
    subscriptionId: string;
    customerId?: string;
    data: any;
  } {
    // Simple mapper for our mock events or Stripe-like events
    let type: any = 'subscription_updated';
    
    if (body.type === 'invoice.payment_failed') type = 'payment_failed';
    if (body.type === 'customer.subscription.deleted') type = 'subscription_deleted';

    return {
      type,
      subscriptionId: body.data?.object?.subscription || body.data?.object?.id,
      customerId: body.data?.object?.customer,
      data: body.data?.object,
    };
  }
}

export const paymentProvider = new MockPaymentProvider();
