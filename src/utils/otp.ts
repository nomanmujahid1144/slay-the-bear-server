import crypto from 'crypto';

/**
 * OTP Utility - Generate secure one-time passwords
 */
export class OTPUtil {
  /**
   * Generate a 6-digit numeric OTP
   */
  static generate(): string {
    // crypto.randomInt is cryptographically secure (avoids Math.random)
    return crypto.randomInt(100000, 1000000).toString();
  }
}