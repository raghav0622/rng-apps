import { BaseEntity } from '@/lib/firestore-repository/types';
import { z } from 'zod';

/**
 * 🏢 Organization Entity
 * The root container for all tenant data.
 */
export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),

  // Ownership
  ownerId: z.string(), // The User ID of the primary owner

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Organization = z.infer<typeof OrganizationSchema> & BaseEntity;

/**
 * Input for creating an organization.
 */
export const CreateOrgSchema = OrganizationSchema.pick({
  name: true,
});

export type CreateOrgInput = z.infer<typeof CreateOrgSchema>;

/**
 * Input for updating an organization settings.
 */
export const UpdateOrgSchema = OrganizationSchema.pick({
  name: true,
}).partial();

export type UpdateOrgInput = z.infer<typeof UpdateOrgSchema>;
