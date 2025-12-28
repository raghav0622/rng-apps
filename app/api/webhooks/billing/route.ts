import { billingService } from '@/core/billing/billing.service';
import { env } from '@/lib/env';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 💳 Billing Webhook Handler
 * Currently supports a "Mock" strategy but follows Stripe's architectural patterns.
 * In production: Integrate 'stripe' library and verify signatures.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  // 1. Verification (Simulated for Mocking)
  // In production: const sig = req.headers.get('stripe-signature');
  // const event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  const event = body; 

  console.log(`[Billing Webhook] Received Event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // A new subscription was created or updated via checkout
        // event.data.object.client_reference_id contains our orgId
        // In reality, you'd fetch the full subscription from Stripe here.
        break;

      case 'invoice.payment_failed':
        // Payment failed for an existing subscription
        const subscriptionId = event.data?.object?.subscription;
        if (subscriptionId) {
          await billingService.handlePaymentFailed(subscriptionId);
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Subscription status changed (e.g. cancelled, trialed -> active, etc)
        await billingService.handleSubscriptionSync(event.data.object);
        break;

      default:
        console.log(`[Billing Webhook] Unhandled event type: ${event.type}`);
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

/**
 * Stripe requires the raw body for signature verification.
 * Next.js 13+ handles this automatically with req.json() if you don't use bodyParsers.
 */
export const dynamic = 'force-dynamic';
