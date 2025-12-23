import { clientAuth } from '@/lib/firebase/client';
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  signInWithEmailAndPassword,
  verifyPasswordResetCode,
} from 'firebase/auth';

export class AuthApiProvider {
  /**
   * Verifies the email code and returns the email address associated with it.
   */
  static async verifyEmailCode(oobCode: string): Promise<string | null> {
    // 1. Check the code first to get the metadata (email)
    const info = await checkActionCode(clientAuth, oobCode);
    const email = info.data.email || null;

    // 2. Apply the code to actually verify the user in Firebase Auth
    await applyActionCode(clientAuth, oobCode);

    return email;
  }

  /**
   * Resets the password and returns the email address of the user.
   */
  static async resetPassword(oobCode: string, newPw: string): Promise<string | null> {
    // 1. Verify the code to get the email address
    const email = await verifyPasswordResetCode(clientAuth, oobCode);

    // 2. Confirm the password change
    await confirmPasswordReset(clientAuth, oobCode, newPw);

    return email;
  }

  /**
   * Verifies if the provided password is correct for the given email.
   * Used for sensitive actions like changing passwords.
   */
  static async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      // Attempt a sign-in to verify credentials without persisting the session
      await signInWithEmailAndPassword(clientAuth, email, password);
      return true;
    } catch (e) {
      return false;
    }
  }
}
