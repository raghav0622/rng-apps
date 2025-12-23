import { clientAuth } from '@/lib/firebase/client';
import {
  sendPasswordResetEmail,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

export function useFirebaseClientAuth() {
  /**
   * Signs in using email/password and returns a fresh ID Token.
   */
  const signInEmail = async (email: string, pass: string): Promise<string> => {
    const userCredential = await signInWithEmailAndPassword(clientAuth, email, pass);
    return await userCredential.user.getIdToken();
  };

  /**
   * Signs in using a custom token (from server registration) and returns a fresh ID Token.
   */
  const signInCustom = async (token: string): Promise<string> => {
    const userCredential = await signInWithCustomToken(clientAuth, token);
    return await userCredential.user.getIdToken();
  };

  /**
   * Sends a password reset email to the specified address.
   */
  const sendResetEmail = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(clientAuth, email, {
      url: `${window.location.origin}/auth-action-handler?mode=resetPassword`,
      handleCodeInApp: true,
    });
  };

  /**
   * Clears the client-side session.
   */
  const clientLogout = async () => {
    await signOut(clientAuth);
  };

  return { signInEmail, signInCustom, sendResetEmail, clientLogout };
}
