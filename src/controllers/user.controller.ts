import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import type { AuthRequest } from '../types';
import { deleteFromSupabase, uploadToSupabase } from '../utils/fileUpload';
import { ReferralService } from '../services/referral.service';

/**
 * User Controller - Handles HTTP requests for user operations
 */
export class UserController {
  /**
   * GET /api/users/profile
   * Get authenticated user's profile
   */
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`Profile request for user: ${userId}`);

      const user = await UserService.getUserProfile(userId);

      return ApiResponseUtil.success(
        res,
        user,
        'User profile retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/profile
   * Update user profile
   */
  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { firstName, lastName, phone, location } = req.body;
      console.log(req.body)

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`Profile update request for user: ${userId}`);

      const result = await UserService.updateUserProfile(userId, firstName, lastName, phone, location);

      return ApiResponseUtil.success(
        res,
        undefined,
        result.message,
        200
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateProfilePicture(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const file = req.file;
      if (!file) {
        return ApiResponseUtil.error(res, 'No file uploaded', 400);
      }

      // Get current user
      const currentUser = await UserService.getUserById(userId);
      const oldPictureUrl = currentUser.picture;

      // Upload new picture
      const pictureUrl = await uploadToSupabase(file, userId);

      // Save URL to database
      const result = await UserService.updateProfilePicture(userId, pictureUrl);

      // Delete old picture
      if (oldPictureUrl) {
        await deleteFromSupabase(oldPictureUrl, userId);
      }

      return ApiResponseUtil.success(res, { picture: result.picture }, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async generateReferralCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const result = await ReferralService.generateReferralCode(userId);
      return ApiResponseUtil.success(res, result, 'Referral code generated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getReferralStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const stats = await ReferralService.getReferralStats(userId);
      return ApiResponseUtil.success(res, stats, 'Referral stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async validateReferralCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      if (!code) {
        return ApiResponseUtil.error(res, 'Referral code is required', 400);
      }

      const result = await ReferralService.validateReferralCode(code);

      if (result.valid) {
        return ApiResponseUtil.success(res, result, result.message);
      } else {
        return ApiResponseUtil.error(res, result.message, 400);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/subscription
   * Get user's subscription details
   */
  static async getSubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`Subscription request for user: ${userId}`);

      const subscription = await UserService.getUserSubscription(userId);

      console.log(subscription, 'subscription')

      return ApiResponseUtil.success(
        res,
        subscription,
        'Subscription retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/billing
   * Get user's billing details (invoices)
   */
  static async getBillingDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`Billing details request for user: ${userId}`);

      const invoices = await UserService.getUserBillingDetails(userId);

      return ApiResponseUtil.success(
        res,
        invoices,
        'Billing details retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }
}