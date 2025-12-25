import { z } from 'zod';

export const OrgSettingsSchema = z.object({
  // General
  timezone: z.string().default('UTC'),
  locale: z.string().default('en-US'),
  dateFormat: z.string().default('MM/DD/YYYY'),

  // Branding
  primaryColor: z.string().optional(),
  logoUrl: z.string().url().optional(),

  // Security
  mfaRequired: z.boolean().default(false),
  domainRestriction: z.array(z.string()).default([]),
});

export type OrgSettings = z.infer<typeof OrgSettingsSchema>;

// Input for updating settings
export const UpdateSettingsSchema = OrgSettingsSchema.partial();
