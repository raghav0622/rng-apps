// features/auth/auth.model.ts
import { BaseEntity } from '@/lib/firestore-repository/types';
import { z } from 'zod';
import { UserRoleInOrg } from '../../lib/action-policies';

/**
 * 🔒 User Entity
 * Represents a global user in the system.
 * * STRICT TENANCY RULE:
 * A user can only belong to ONE organization at a time (orgId).
 * To switch orgs, they must leave the current one.
 */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),

  // Tenancy & RBAC
  orgId: z.string().optional().nullable(),
  orgRole: z.enum(UserRoleInOrg).default(UserRoleInOrg.NOT_IN_ORG),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),

  // Flattened preferences or flags can go here
  isOnboarded: z.boolean().default(false),
});

export type User = z.infer<typeof UserSchema> & BaseEntity;

export const SignUpSchema = z
  .object({
    displayName: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    confirmPassword: z.string().min(6).max(100),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        message: 'Passwords do not match',
        code: 'custom',
        path: ['confirmPassword'],
      });
    }
  });

export type SignUpInput = z.infer<typeof SignUpSchema>;
