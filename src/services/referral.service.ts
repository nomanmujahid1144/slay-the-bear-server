// src/services/referral.service.ts
import { db } from '../db';
import { users, referrals } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { ReferralCodeUtil } from '../utils/referralCode';

export class ReferralService {
  /**
   * Generate or regenerate referral code for user
   */
  static async generateReferralCode(userId: string): Promise<{ referralCode: string }> {
    try {
      logger.info(`Generating referral code for user: ${userId}`);

      // Get user details
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        throw ApiError.notFound('User not found');
      }

      const user = existingUser[0];

      // Check if user already has a code
      if (user.referralCode) {
        return { referralCode: user.referralCode };
      }

      // Generate personalized code based on first name
      const referralCode = await ReferralCodeUtil.generatePersonalizedCode(user.firstName);

      // Update user with new code
      await db
        .update(users)
        .set({
          referralCode,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      logger.info(`Referral code generated: ${referralCode} for user: ${userId}`);

      return { referralCode };
    } catch (error: any) {
      logger.error('Generate referral code error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Validate if a referral code is valid
   */
  static async validateReferralCode(code: string): Promise<{ valid: boolean; message: string }> {
    try {
      const result = await ReferralCodeUtil.validateCode(code);

      if (!result.valid) {
        return {
          valid: false,
          message: 'Invalid referral code',
        };
      }

      return {
        valid: true,
        message: 'Valid referral code',
      };
    } catch (error: any) {
      logger.error('Validate referral code error', { error: error.message });
      throw ApiError.internal(error.message);
    }
  }

  /**
   * Apply referral code when user signs up
   * Called during signup process
   */
  static async applyReferralCode(
    newUserId: string,
    referralCode: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      logger.info(`Applying referral code: ${referralCode} for user: ${newUserId}`);

      // Validate the referral code
      const validation = await ReferralCodeUtil.validateCode(referralCode);

      if (!validation.valid || !validation.userId) {
        throw ApiError.badRequest('Invalid referral code');
      }

      const referrerId = validation.userId;

      // Prevent self-referral
      if (referrerId === newUserId) {
        throw ApiError.badRequest('You cannot use your own referral code');
      }

      // Update new user's referredBy field
      await db
        .update(users)
        .set({
          referredBy: referrerId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, newUserId));

      // Create referral tracking record
      await db.insert(referrals).values({
        referrerId,
        refereeId: newUserId,
        codeUsed: referralCode,
        status: 'pending', // Will be 'completed' when user verifies email
      });

      // Increment referrer's referral count
      await db
        .update(users)
        .set({
          referralCount: sql`${users.referralCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, referrerId));

      logger.info(`Referral applied successfully: ${referralCode} -> ${newUserId}`);

      return {
        success: true,
        message: 'Referral code applied successfully',
      };
    } catch (error: any) {
      logger.error('Apply referral code error', { error: error.message, referralCode });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Mark referral as completed (when user verifies email)
   */
  static async completeReferral(userId: string): Promise<void> {
    try {
      // Update referral status to completed
      await db
        .update(referrals)
        .set({
          status: 'completed',
          rewardGiven: true, // You can implement reward logic here
          updatedAt: new Date(),
        })
        .where(eq(referrals.refereeId, userId));

      logger.info(`Referral completed for user: ${userId}`);
    } catch (error: any) {
      logger.error('Complete referral error', { error: error.message, userId });
      // Don't throw error - this is a background operation
    }
  }

  /**
   * Get user's referral statistics
   */
  static async getReferralStats(userId: string): Promise<{
    referralCode: string | null;
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    referrals: Array<{
      id: string;
      refereeName: string;
      status: string;
      createdAt: Date;
    }>;
  }> {
    try {
      // Get user's referral code
      const user = await db
        .select({ referralCode: users.referralCode, referralCount: users.referralCount })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw ApiError.notFound('User not found');
      }

      // Get all referrals made by this user
      const userReferrals = await db
        .select({
          id: referrals.id,
          refereeId: referrals.refereeId,
          status: referrals.status,
          createdAt: referrals.createdAt,
        })
        .from(referrals)
        .where(eq(referrals.referrerId, userId));

      // Get referee details
      const referralDetails = await Promise.all(
        userReferrals.map(async (ref) => {
          const referee = await db
            .select({ firstName: users.firstName, lastName: users.lastName })
            .from(users)
            .where(eq(users.id, ref.refereeId))
            .limit(1);

          return {
            id: ref.id,
            refereeName: referee.length > 0 
              ? `${referee[0].firstName} ${referee[0].lastName}`
              : 'Unknown',
            status: ref.status,
            createdAt: ref.createdAt,
          };
        })
      );

      const completedCount = userReferrals.filter((r) => r.status === 'completed').length;
      const pendingCount = userReferrals.filter((r) => r.status === 'pending').length;

      return {
        referralCode: user[0].referralCode,
        totalReferrals: user[0].referralCount,
        completedReferrals: completedCount,
        pendingReferrals: pendingCount,
        referrals: referralDetails,
      };
    } catch (error: any) {
      logger.error('Get referral stats error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }
}