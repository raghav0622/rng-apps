import { describe, expect, it } from 'vitest';
import { LoginSchema, ResetPasswordSchema } from './auth.model';

describe('Auth Models', () => {
  describe('LoginSchema', () => {
    it('should validate correct inputs', () => {
      const result = LoginSchema.safeParse({ email: 'test@test.com', password: 'password123' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid emails', () => {
      const result = LoginSchema.safeParse({ email: 'not-an-email', password: 'password123' });
      expect(result.success).toBe(false);
    });
  });

  describe('ResetPasswordSchema', () => {
    it('should fail if passwords do not match', () => {
      const result = ResetPasswordSchema.safeParse({
        password: 'password123',
        confirmPassword: 'different-password',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmPassword');
        expect(result.error.issues[0].message).toBe("Passwords don't match");
      }
    });

    it('should pass if passwords match', () => {
      const result = ResetPasswordSchema.safeParse({
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(result.success).toBe(true);
    });
  });
});
