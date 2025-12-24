import { SignUpInput } from '../auth.model';

/**
 * Service handling core authentication flows.
 */
export class AuthService {
  /**
   * Registers a new user with the system.
   *
   * @param {SignUpInput} input - The user registration details.
   * @returns {Promise<void>} Resolves when the user is created.
   * @throws {Error} If the email is already in use or validation fails.
   *
   * @example
   * await AuthService.signup({
   * email: "new@example.com",
   * password: "Password123",
   * displayName: "John Doe"
   * });
   */
  static async signup(input: SignUpInput) {}

  /**
   * Authenticates a user via email and password.
   *
   * @param {string} email - The user's email address.
   * @param {string} password - The user's password.
   * @returns {Promise<void>} Resolves on successful login.
   *
   * @example
   * await AuthService.login("user@example.com", "secret");
   */
  static async login(email: string, password: string) {}
}
