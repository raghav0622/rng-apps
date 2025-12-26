import { clientAuth as auth } from '@/lib/firebase/client';
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
} from 'firebase/auth';

export const authClient = {
  /**
   * Trigger the "Forgot Password" email.
   */
  async sendPasswordResetLink(email: string) {
    // Defines where the user is redirected after clicking the link
    const actionCodeSettings = {
      url: `${window.location.origin}/login`, // Redirect to login after success
      handleCodeInApp: true,
    };
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  },

  /**
   * Verify the code from the email URL to ensure it's valid
   * and retrieve the associated email address (useful for UI).
   */
  async verifyResetCode(code: string) {
    return await verifyPasswordResetCode(auth, code);
  },

  /**
   * Complete the password reset process with the new password.
   */
  async confirmPasswordReset(code: string, newPassword: string) {
    await confirmPasswordReset(auth, code, newPassword);
  },

  /**
   * Handle Email Verification codes.
   */
  async verifyEmail(code: string) {
    await applyActionCode(auth, code);
  },

  /**
   * Generic check for any action code (reset, verify, recover).
   * Returns metadata about the code.
   */
  async checkActionCode(code: string) {
    return await checkActionCode(auth, code);
  },
};
