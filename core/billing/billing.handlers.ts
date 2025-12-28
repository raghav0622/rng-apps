import { AppEvent } from '@/core/abstract-event-bus/AbstractEventBus';
import { billingService } from '@/core/billing/billing.service';
import { logError, logInfo } from '@/lib/logger';

export const billingHandlers = {
  /**
   * Listener for 'org.created'
   */
  async onOrgCreated(event: AppEvent) {
    const { orgId } = event.payload;
    if (!orgId) {
      logError('Missing orgId in org.created event', event as Record<string, any>);
      return;
    }

    logInfo(`[Event] Creating trial for Org: ${orgId}`);
    await billingService.createTrial(orgId);
  },
};
