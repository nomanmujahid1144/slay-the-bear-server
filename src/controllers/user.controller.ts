import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import type { AuthRequest } from '../types';

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
      const { firstName, lastName } = req.body;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`Profile update request for user: ${userId}`);

      const result = await UserService.updateUserProfile(userId, firstName, lastName);

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