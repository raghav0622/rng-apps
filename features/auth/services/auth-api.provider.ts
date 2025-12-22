import { AppErrorCode, CustomError } from '@/lib/errors';

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const ID_TOOLKIT_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

if (!API_KEY) {
  // Warn instead of throw to allow build process to pass if envs aren't loaded yet
  console.warn('⚠️ Missing NEXT_PUBLIC_FIREBASE_API_KEY. Auth REST operations will fail.');
}

export class AuthApiProvider {
  /**
   * Generic POST wrapper for Identity Toolkit
   */
  private static async post<T>(endpoint: string, body: object): Promise<T> {
    if (!API_KEY) throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY');

    const response = await fetch(`${ID_TOOLKIT_URL}:${endpoint}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new CustomError(AppErrorCode.INVALID_INPUT, data.error?.message || 'Auth API Error');
    }
    return data;
  }

  /**
   * Verifies a user's password using the REST API.
   * Admin SDK cannot do this.
   */
  static async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      await this.post('signInWithPassword', {
        email,
        password,
        returnSecureToken: true,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Updates OOB (Out of Band) codes for email verification.
   */
  static async verifyEmailCode(oobCode: string): Promise<void> {
    await this.post('update', { oobCode });
  }

  /**
   * Resets password using the OOB code.
   */
  static async resetPassword(oobCode: string, newPassword: string): Promise<void> {
    await this.post('resetPassword', { oobCode, newPassword });
  }
}
