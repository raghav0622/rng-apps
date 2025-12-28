'use server';

import { AppPermission } from '@/core/action-policies';
import { billingService } from '@/core/billing/billing.service';
import { orgActionClient } from '@/core/safe-action/safe-action';
import { CheckoutSessionSchema, PortalSessionSchema } from './billing.model';

export const createCheckoutSessionAction = orgActionClient
  .metadata({ name: 'billing.checkout', permissions: [AppPermission.ORG_UPDATE] })
  .schema(CheckoutSessionSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await billingService.createCheckoutSession(
      ctx.orgId,
      ctx.userId,
      parsedInput.planId,
    );
  });

export const createPortalSessionAction = orgActionClient
  .metadata({ name: 'billing.portal', permissions: [AppPermission.ORG_UPDATE] })
  .schema(PortalSessionSchema)
  .action(async ({ ctx }) => {
    return await billingService.createPortalSession(ctx.orgId);
  });
