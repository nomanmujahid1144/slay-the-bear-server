import bcrypt from 'bcryptjs';
import config from '../config';

export class PasswordUtil {
  // Hash a password
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
  }

  // Compare password with hash
  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate a random token for email verification/password reset
  static async generateToken(data: string): Promise<string> {
    return bcrypt.hash(data, 10);
  }
}