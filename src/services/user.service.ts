import { db } from '../db';
import { users, subscriptions, subscriptionEntries } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { Plan } from '../constants/enums';
import type { UserResponse } from '../types';
import type { Location } from '../types/user/location.types';

export class UserService {
  /**
   * Get User Profile
   * Converts: /api/users/profile
   */
  static async getUserProfile(userId: string): Promise<UserResponse> {
    try {
      logger.info(`Getting profile for user: ${userId}`);

      const existingUser = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          location: users.location,
          picture: users.picture,
          isVerified: users.isVerified,
          plan: users.plan,
          referralCode: users.referralCode,
          referralCount: users.referralCount,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        throw ApiError.notFound('User does not exist');
      }

      const user = existingUser[0];

      logger.info(`Profile retrieved for: ${user.email}`);

      return {
        ...user,
        plan: user.plan as Plan,
      };
    } catch (error: any) {
      logger.error('Get profile error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Update User Profile
   * Converts: /api/users/update-user
   */
  static async updateUserProfile(
    userId: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
    location?: Location
  ): Promise<{ message: string }> {
    try {
      logger.info(`Updating profile for user: ${userId}`);

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        throw ApiError.notFound('User not found');
      }

      const updateData: any = { updatedAt: new Date() };
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (location !== undefined) updateData.location = location;

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      logger.info(`Profile updated for user: ${userId}`);

      return {
        message: 'Profile updated successfully',
      };
    } catch (error: any) {
      logger.error('Update profile error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  static async updateProfilePicture(
    userId: string,
    pictureUrl: string
  ): Promise<{ message: string; picture: string }> {
    try {
      logger.info(`Updating profile picture for user: ${userId}`);

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        throw ApiError.notFound('User not found');
      }

      await db
        .update(users)
        .set({
          picture: pictureUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      logger.info(`Profile picture updated for user: ${userId}`);

      return {
        message: 'Profile picture updated successfully',
        picture: pictureUrl,
      };
    } catch (error: any) {
      logger.error('Update profile picture error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Get User's Latest Subscription
   * Converts: /api/users/get-user-latest-subscription
   */
  static async getUserSubscription(userId: string): Promise<any> {
    try {
      logger.info(`Getting subscription for user: ${userId}`);

      const userSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (userSubscription.length === 0) {
        throw ApiError.notFound('No subscription found');
      }

      logger.info(`Subscription found for user: ${userId}`);

      return userSubscription[0];
    } catch (error: any) {
      logger.error('Get subscription error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Get User's Billing Details (Invoice History)
   * Converts: /api/users/get-user-billing-detail
   */
  static async getUserBillingDetails(userId: string): Promise<any[]> {
    try {
      logger.info(`Getting billing details for user: ${userId}`);

      // First get user's subscription
      const userSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (userSubscription.length === 0) {
        logger.info(`No subscription found for user: ${userId}`);
        return [];
      }

      const subscription = userSubscription[0];

      // Get all subscription entries (invoices) for this subscription
      const invoices = await db
        .select()
        .from(subscriptionEntries)
        .where(eq(subscriptionEntries.subscriptionId, subscription.id))
        .orderBy(desc(subscriptionEntries.createdAt)); // Most recent first

      logger.info(`Retrieved ${invoices.length} invoices for user: ${userId}`);

      return invoices;
    } catch (error: any) {
      logger.error('Get billing details error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Get User by ID (Internal use - includes all fields)
   */
  static async getUserById(userId: string) {
    try {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        throw ApiError.notFound('User not found');
      }

      return existingUser[0];
    } catch (error: any) {
      logger.error('Get user by ID error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Get User by Email (Internal use)
   */
  static async getUserByEmail(email: string) {
    try {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length === 0) {
        return null;
      }

      return existingUser[0];
    } catch (error: any) {
      logger.error('Get user by email error', { error: error.message, email });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Update User Plan (Used by Stripe webhooks)
   */
  static async updateUserPlan(userId: string, plan: Plan): Promise<void> {
    try {
      logger.info(`Updating plan for user ${userId} to ${plan}`);

      await db
        .update(users)
        .set({
          plan,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      logger.info(`Plan updated successfully for user: ${userId}`);
    } catch (error: any) {
      logger.error('Update user plan error', { error: error.message, userId, plan });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Update User Stripe Customer ID
   */
  static async updateCustomerId(userId: string, customerId: string): Promise<void> {
    try {
      logger.info(`Updating Stripe customer ID for user: ${userId}`);

      await db
        .update(users)
        .set({
          customerId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      logger.info(`Customer ID updated for user: ${userId}`);
    } catch (error: any) {
      logger.error('Update customer ID error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }
}