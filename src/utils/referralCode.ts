// src/utils/referralCode.ts
import { customAlphabet } from 'nanoid';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a unique referral code
 * Format: Uppercase letters and numbers, 8 characters
 * Example: ABC12XYZ
 */
export class ReferralCodeUtil {
  // Create custom alphabet (uppercase letters + numbers, excluding confusing characters)
  private static nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

  /**
   * Generate a unique referral code that doesn't exist in database
   */
  static async generateUniqueCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = this.nanoid();

      // Check if code already exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, code))
        .limit(1);

      if (existing.length === 0) {
        return code;
      }

      attempts++;
    }

    // Fallback: Add timestamp if we couldn't generate unique in 10 tries
    return this.nanoid() + Date.now().toString(36).slice(-4).toUpperCase();
  }

  /**
   * Generate code based on user's name (more memorable)
   * Format: FIRSTNAME + 4 random chars
   * Example: JOHN2X4Z
   */
  static async generatePersonalizedCode(firstName: string): Promise<string> {
    const cleanName = firstName
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 4)
      .padEnd(4, 'X');

    const randomSuffix = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4)();
    let code = cleanName + randomSuffix;

    // Check uniqueness
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);

    if (existing.length > 0) {
      // If exists, fall back to completely random
      return this.generateUniqueCode();
    }

    return code;
  }

  /**
   * Validate referral code format
   */
  static isValidFormat(code: string): boolean {
    return /^[A-Z0-9]{6,12}$/.test(code);
  }

  /**
   * Check if referral code exists and return user
   */
  static async validateCode(code: string): Promise<{ valid: boolean; userId?: string }> {
    if (!this.isValidFormat(code)) {
      return { valid: false };
    }

    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);

    if (result.length === 0) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: result[0].id,
    };
  }
}