import { clientAuth } from '@/lib/firebase/client';
import {
  applyActionCode,
  confirmPasswordReset,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCustomToken,
  signOut,
  verifyPasswordResetCode,
} from 'firebase/auth';

// Configuration: Redirect back to this app after email action
const actionCodeSettings = {
  url: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/action`,
  handleCodeInApp: true,
};

export const authClient = {
  /**
   * Trigger Forgot Password Email
   */
  sendPasswordResetEmail: async (email: string) => {
    return sendPasswordResetEmail(clientAuth, email, actionCodeSettings);
  },

  /**
   * Verify code from Reset Password link
   */
  verifyResetCode: async (code: string) => {
    return verifyPasswordResetCode(clientAuth, code);
  },

  /**
   * Complete Password Reset
   */
  confirmPasswordReset: async (code: string, newPassword: string) => {
    return confirmPasswordReset(clientAuth, code, newPassword);
  },

  /**
   * Apply Email Verification Code
   */
  applyActionCode: async (code: string) => {
    return applyActionCode(clientAuth, code);
  },

  /**
   * Send Verification Email (Requires User to be Signed In).
   * Supports 'Hybrid Flow': If a customToken is provided (from server action),
   * it signs in momentarily to send the email.
   */
  sendEmailVerification: async (customToken?: string) => {
    let user = clientAuth.currentUser;

    if (!user && customToken) {
      // Hybrid: Sign in -> Send -> Sign out
      await signInWithCustomToken(clientAuth, customToken);
      user = clientAuth.currentUser;
      if (user) {
        await sendEmailVerification(user, actionCodeSettings);
        await signOut(clientAuth);
      }
      return;
    }

    if (user) {
      await sendEmailVerification(user, actionCodeSettings);
    } else {
      throw new Error('User must be signed in to send verification email.');
    }
  },
};
