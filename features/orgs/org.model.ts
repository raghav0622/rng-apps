import { z } from 'zod';

// ----------------------------------------------------------------------------
// Zod Schemas (Input Validation)
// ----------------------------------------------------------------------------

export const CreateOrganizationSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50),
});

export const UpdateOrganizationSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(3).max(50).optional(),
});

// ----------------------------------------------------------------------------
// TypeScript Types (Domain Entities)
// ----------------------------------------------------------------------------

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']),

  createdAt: z.any(),
  updatedAt: z.any(),
  deletedAt: z.any(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

// Type for creating a new org (internal use)
export type CreateOrgInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrgInput = z.infer<typeof UpdateOrganizationSchema>;
