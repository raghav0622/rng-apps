import { clientAuth } from '@/lib/firebase/client';
import {
  applyActionCode,
  confirmPasswordReset,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  verifyPasswordResetCode,
} from 'firebase/auth';

export function useFirebaseClientAuth() {
  // --- Session Management ---
  const signInEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(clientAuth, email, pass);
    return await cred.user.getIdToken();
  };

  const signInCustom = async (token: string) => {
    const cred = await signInWithCustomToken(clientAuth, token);
    return await cred.user.getIdToken();
  };

  const clientLogout = async () => {
    await signOut(clientAuth);
  };

  // --- Password Management ---
  const sendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(clientAuth, email, {
      url: `${window.location.origin}/auth-action-handler?mode=resetPassword`,
      handleCodeInApp: true,
    });
  };

  const verifyResetCode = async (code: string) => {
    return await verifyPasswordResetCode(clientAuth, code);
  };

  const confirmReset = async (code: string, newPw: string) => {
    await confirmPasswordReset(clientAuth, code, newPw);
  };

  const updateUserPassword = async (newPw: string) => {
    if (!clientAuth.currentUser) throw new Error('No user logged in');
    await updatePassword(clientAuth.currentUser, newPw);
  };

  // --- Email Verification ---
  const verifyEmailCode = async (code: string) => {
    await applyActionCode(clientAuth, code);
  };

  const sendVerification = async () => {
    if (!clientAuth.currentUser) throw new Error('No user logged in');
    await sendEmailVerification(clientAuth.currentUser, {
      url: `${window.location.origin}/auth-action-handler?mode=verifyEmail`,
      handleCodeInApp: true,
    });
  };

  return {
    signInEmail,
    signInCustom,
    clientLogout,
    sendResetEmail,
    verifyResetCode,
    confirmReset,
    updateUserPassword,
    verifyEmailCode,
    sendVerification,
    currentUser: clientAuth.currentUser,
  };
}
