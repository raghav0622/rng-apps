import { z } from 'zod';
import { UserRoleInOrg } from '../enums';

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
  emailVerified: true,
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
