import { z } from 'zod';
import { UserRoleInOrg } from '../enums';
import { AVATAR_ALLOWED_TYPES, AVATAR_MAX_SIZE } from '../storage/storage.config';

export const UserSchema = z.object({
  uid: z.string(),
  displayName: z.string(),
  photoUrl: z.string().optional(),
  email: z.email(),
  emailVerified: z.boolean(),

  lastLoginAt: z.date().optional(),

  createdAt: z.date(),
  deletedAt: z.date().optional(),
  updatedAt: z.date().optional(),

  //organnization
  onboarded: z.boolean(),
  orgRole: z.enum(UserRoleInOrg),
  orgId: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const UserInSessionSchema = UserSchema.omit({
  createdAt: true,
  deletedAt: true,
  lastLoginAt: true,
  updatedAt: true,
});

export type UserInSession = z.infer<typeof UserInSessionSchema>;

export const OrgDataForSessionSchema = UserSchema.pick({
  onboarded: true,
  orgId: true,
  orgRole: true,
});

export type OrgDataForSession = z.infer<typeof OrgDataForSessionSchema>;

export const CreateUserInDatabasSchema = UserSchema.omit({
  createdAt: true,
  deletedAt: true,
  updatedAt: true,
  lastLoginAt: true,
  emailVerified: true,
  onboarded: true,
  orgId: true,
  orgRole: true,
  photoUrl: true,
});

export type CreateUserInDatabase = z.infer<typeof CreateUserInDatabasSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Name is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.email('Invalid email address'),
});

// --- New Schema ---
export const ConfirmPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// --- Types ---
export type ConfirmPasswordInput = z.infer<typeof ConfirmPasswordSchema>;

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

// --- SESSION SCHEMAS ---

export const SessionDbSchema = z.object({
  sessionId: z.string(),
  uid: z.string(),
  createdAt: z.any(), // Firestore Timestamp
  expiresAt: z.any(), // Firestore Timestamp
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  isValid: z.boolean(),
});

// 2. Create a strict Client Schema
export const SessionClientSchema = SessionDbSchema.extend({
  createdAt: z.number(), // Epoch milliseconds
  expiresAt: z.number(), // Epoch milliseconds
});

export type Session = z.infer<typeof SessionClientSchema>;

export type SessionDb = z.infer<typeof SessionDbSchema>;

export const CreateSessionSchema = z.object({
  idToken: z.string(),
});

// --- Profile Schema ---
export const ProfileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address').optional(), // Read-only often
  photoURL: z
    .union([
      z.string().nullable(), // For existing URL or clearing (null)
      z
        .instanceof(File) // For new uploads
        .refine((f) => f.size <= AVATAR_MAX_SIZE, 'Max file size is 5MB')
        .refine(
          (f) => AVATAR_ALLOWED_TYPES.includes(f.type),
          'Only .jpg, .png, .webp, and .gif formats are supported',
        ),
    ])
    .optional()
    .nullable(),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;
