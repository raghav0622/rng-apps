import { BaseEntity } from '@/core/abstract-firestore-repository/types';
import { z } from 'zod';

export enum EntityType {
  CLIENT = 'CLIENT',
  VENDOR = 'VENDOR',
  CONTRACTOR = 'CONTRACTOR',
  CONSULTANT = 'CONSULTANT',
}

export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLACKLISTED = 'BLACKLISTED',
}

const PointOfContactSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

const ProviderDetails = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  productsOffered: z.array(z.string()).default([]),
  servicesOffered: z.array(z.string()).default([]),
  pointOfContacts: z.array(PointOfContactSchema).default([]),

  financialTerms: z
    .object({
      standardDiscountPercent: z.number().optional(), // e.g., 20
      paymentTerms: z.string().optional(), // "Net 30"
      // REMOVED: taxID as requested
    })
    .optional(),
});

export const EntitySchema = z.object({
  id: z.string(),
  orgId: z.string(),

  type: z.nativeEnum(EntityType),
  name: z.string().min(2), // Display Name / Business Name

  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),

  tags: z.array(z.string()).default([]), // Taxonomy
  rating: z.number().min(0).max(5).default(0),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),

  details: ProviderDetails.optional(),

  notes: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Entity = z.infer<typeof EntitySchema> & BaseEntity;
export type EntityInput = z.infer<typeof EntitySchema>;
