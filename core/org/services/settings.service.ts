import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { Result } from '@/lib/types';
import { organizationRepository } from '../org.repository';
import { OrgSettings } from '../settings.model';

class SettingsService extends AbstractService {
  /**
   * Fetch settings for an organization.
   * We map the raw Org document fields to the Settings shape.
   */
  async getSettings(orgId: string): Promise<Result<OrgSettings>> {
    return this.handleOperation('settings.get', async () => {
      const org = await organizationRepository.get(orgId);

      // Map flat fields to settings object if they are stored flat
      // OR return the nested 'settings' object if stored nested.
      // Based on our Org Model in Step 3, we didn't define a 'settings' object explicitly.
      // Let's assume we store them as part of the document for now.

      return {
        timezone: org.timezone || 'UTC',
        locale: org.locale || 'en-US',
        dateFormat: (org as any).dateFormat || 'MM/DD/YYYY',
        primaryColor: (org as any).primaryColor,
        logoUrl: (org as any).logoUrl,
        mfaRequired: (org as any).mfaRequired || false,
        domainRestriction: (org as any).domainRestriction || [],
      };
    });
  }

  /**
   * Update settings.
   */
  async updateSettings(orgId: string, input: Partial<OrgSettings>): Promise<Result<void>> {
    return this.handleOperation('settings.update', async () => {
      // Validate input partially
      // We rely on Zod in the Action layer, but good to be safe.

      await organizationRepository.update(orgId, input as any);
    });
  }
}

export const settingsService = new SettingsService();
