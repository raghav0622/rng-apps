import { billingService } from '@/core/billing/billing.service';
import { paymentProvider } from '@/lib/payment-provider/mock-provider';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 💳 Billing Webhook Handler
 * Uses the Abstract Payment Provider to parse events.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') || ''; // Generic header

  // 1. Verify Signature via Provider
  const isValid = await paymentProvider.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const body = JSON.parse(rawBody);
  const event = paymentProvider.parseWebhookEvent(body);

  console.log(`[Billing Webhook] Normalized Event: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment_failed':
        await billingService.handlePaymentFailed(event.subscriptionId);
        break;

      case 'subscription_updated':
      case 'subscription_deleted':
        await billingService.handleSubscriptionSync(event.data);
        break;

      default:
        console.log(`[Billing Webhook] Ignored event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`[Billing Webhook] Error: ${error.message}`);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
