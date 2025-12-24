import { SignUpInput } from '../auth.model';

export class AuthService {
  static async signup(input: SignUpInput) {}

  static async login(email: string, password: string) {}
}
