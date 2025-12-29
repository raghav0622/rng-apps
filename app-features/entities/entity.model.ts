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

// Sub-schema: Insurance & Compliance
const InsurancePolicySchema = z.object({
  provider: z.string(),
  policyNumber: z.string(),
  coverageAmount: z.number(),
  expiryDate: z.date(),
  documentUrl: z.string().url().optional(),
});

const ComplianceDetailsSchema = z.object({
  taxId: z.string().optional(),
  licenseNumber: z.string().optional(),
  insurancePolicies: z.array(InsurancePolicySchema).default([]),
  isVetted: z.boolean().default(false),
});

// Sub-schema: Provider Specifics
const ProviderDetailsSchema = z.object({
  category: z.string().optional(), // e.g., "Masonry", "HVAC"
  subcategory: z.string().optional(),
  productsOffered: z.array(z.string()).default([]),
  servicesOffered: z.array(z.string()).default([]),

  financialTerms: z
    .object({
      standardDiscountPercent: z.number().default(0),
      paymentTerms: z.string().default('Net 30'),
    })
    .optional(),
});

export const EntitySchema = z.object({
  id: z.string(),
  orgId: z.string(), // Tenancy

  type: z.nativeEnum(EntityType),
  name: z.string().min(2),

  // Contact Info
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),

  // Metadata
  tags: z.array(z.string()).default([]), // Trade Tags
  rating: z.number().min(0).max(5).default(0),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),

  // Domain Specifics
  details: ProviderDetailsSchema.optional(),
  compliance: ComplianceDetailsSchema.optional(),

  notes: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Entity = z.infer<typeof EntitySchema> & BaseEntity;

// Input type for creating/updating entities (omits auto-generated fields)
export type EntityInput = Omit<Entity, 'id' | 'orgId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
