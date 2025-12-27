import { clientAuth as auth } from '@/lib/firebase/client';
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  verifyPasswordResetCode,
} from 'firebase/auth';

export const authClient = {
  /**
   * Trigger Google Sign-In Popup.
   */
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    return { idToken };
  },

  /**
   * Trigger the "Forgot Password" email.
   */
  async sendPasswordResetLink(email: string) {
    const actionCodeSettings = {
      url: `${window.location.origin}/login`,
      handleCodeInApp: true,
    };
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  },

  /**
   * Send Verification Email to the currently signed-in user.
   */
  async sendVerificationEmail() {
    if (!auth.currentUser) throw new Error('No user signed in');

    const actionCodeSettings = {
      url: `${window.location.origin}/dashboard`,
      handleCodeInApp: true,
    };
    await sendEmailVerification(auth.currentUser, actionCodeSettings);
  },

  /**
   * Verify the code from the email URL.
   */
  async verifyResetCode(code: string) {
    return await verifyPasswordResetCode(auth, code);
  },

  /**
   * Complete the password reset process.
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
   * Generic check for any action code.
   */
  async checkActionCode(code: string) {
    return await checkActionCode(auth, code);
  },
};
