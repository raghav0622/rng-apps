import { clientAuth as auth } from '@/lib/firebase/client';
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
} from 'firebase/auth';

export const authClient = {
  /**
   * Trigger the "Forgot Password" email.
   */
  async sendPasswordResetLink(email: string) {
    const actionCodeSettings = {
      // The user will land on /action-handler?mode=resetPassword&oobCode=...
      // We don't need to specify 'login' here because the handler page manages the flow.
      url: `${window.location.origin}/login`,
      handleCodeInApp: true,
    };
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  },

  /**
   * Send Verification Email to the *currently signed-in* user.
   */
  async sendVerificationEmail() {
    if (!auth.currentUser) throw new Error('No user signed in');

    const actionCodeSettings = {
      // The user will land on /action-handler?mode=verifyEmail&oobCode=...
      url: `${window.location.origin}/dashboard`,
      handleCodeInApp: true,
    };
    await sendEmailVerification(auth.currentUser, actionCodeSettings);
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
