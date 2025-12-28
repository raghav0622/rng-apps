import { BaseEntity } from '@/core/abstract-firestore-repository/types';
import { z } from 'zod';

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete', // Added for Stripe checkout
  INCOMPLETE_EXPIRED = 'incomplete_expired',
}

export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export const SubscriptionSchema = z.object({
  id: z.string(),
  orgId: z.string(),

  // Provider Info (Stripe)
  customerId: z.string().optional(),
  subscriptionId: z.string().optional(),
  priceId: z.string().optional(), // Specific price ID from Stripe

  // Plan Details
  status: z.nativeEnum(SubscriptionStatus).default(SubscriptionStatus.TRIALING),
  planId: z.nativeEnum(SubscriptionPlan).default(SubscriptionPlan.FREE),

  // Usage Limits (Snapshot from Plan)
  seats: z.number().default(5), // Default Free Limit

  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  cancelAtPeriodEnd: z.boolean().default(false),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Subscription = z.infer<typeof SubscriptionSchema> & BaseEntity;

// --- Billing Actions Inputs ---
export const CheckoutSessionSchema = z.object({
  planId: z.nativeEnum(SubscriptionPlan),
});

export const PortalSessionSchema = z.object({
  returnUrl: z.string().optional(),
});
