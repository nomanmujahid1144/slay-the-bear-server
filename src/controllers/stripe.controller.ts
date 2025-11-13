import { Response, NextFunction } from 'express';
import { StripeService } from '../services/stripe.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import type { AuthRequest } from '../types';
import config from '../config';

/**
 * Stripe Controller - Handles subscription and payment requests
 */
export class StripeController {
  /**
   * POST /api/stripe/create-checkout-session
   * Create Stripe checkout session for subscription
   */
  static async createCheckoutSession(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      const { period } = req.body; // 'monthly' or 'yearly'

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`Checkout session request for user: ${userId}, period: ${period}`);

      // Determine price ID based on period
      const priceId =
        period === 'monthly'
          ? config.STRIPE_MONTHLY_PRICE_ID
          : config.STRIPE_YEARLY_PRICE_ID;

      const result = await StripeService.createCheckoutSession(userId, priceId, period);

      return ApiResponseUtil.success(
        res,
        result,
        'Checkout session created successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stripe/session/:sessionId
   * Get session details for success page
   */
  static async getSessionDetails(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { sessionId } = req.params;

      logger.info(`Session details request: ${sessionId}`);

      const details = await StripeService.getSessionDetails(sessionId);

      return ApiResponseUtil.success(
        res,
        details,
        'Session details retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/stripe/cancel-subscription
   * Cancel subscription (at period end)
   */
  static async cancelSubscription(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`Cancel subscription request for user: ${userId}`);

      const result = await StripeService.cancelSubscription(userId);

      return ApiResponseUtil.success(res, undefined, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/stripe/reactivate-subscription
   * Reactivate canceled subscription
   */
  static async reactivateSubscription(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`Reactivate subscription request for user: ${userId}`);

      const result = await StripeService.reactivateSubscription(userId);

      return ApiResponseUtil.success(res, undefined, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stripe/customer-portal
   * Get Stripe customer portal URL
   */
  static async getCustomerPortal(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`Customer portal request for user: ${userId}`);

      const result = await StripeService.getCustomerPortalUrl(userId);

      return ApiResponseUtil.success(
        res,
        result,
        'Customer portal URL retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }
}