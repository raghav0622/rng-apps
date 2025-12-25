import { BaseEntity } from '@/lib/firestore-repository/types';
import { z } from 'zod';

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
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

  // Plan Details
  status: z.nativeEnum(SubscriptionStatus).default(SubscriptionStatus.TRIALING),
  planId: z.nativeEnum(SubscriptionPlan).default(SubscriptionPlan.FREE),

  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  cancelAtPeriodEnd: z.boolean().default(false),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Subscription = z.infer<typeof SubscriptionSchema> & BaseEntity;
