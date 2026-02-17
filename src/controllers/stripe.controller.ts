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
      const { period, planType } = req.body; // period: 'monthly'|'yearly', planType: 'basic'|'premium'

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`Checkout session request for user: ${userId}, period: ${period}`);

      // Determine price ID based on period
      logger.info(`Checkout session request for user: ${userId}, plan: ${planType}, period: ${period}`);

      // Map planType + period → correct Stripe price ID
      const priceId =
        planType === 'basic' && period === 'monthly' ? config.STRIPE_BASIC_MONTHLY_PRICE_ID :
          planType === 'basic' && period === 'yearly' ? config.STRIPE_BASIC_YEARLY_PRICE_ID :
            planType === 'premium' && period === 'monthly' ? config.STRIPE_PREMIUM_MONTHLY_PRICE_ID :
              config.STRIPE_PREMIUM_YEARLY_PRICE_ID;

      const result = await StripeService.createCheckoutSession(userId, priceId, period, planType);

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

  /**
   * POST /api/stripe/change-plan
   * Upgrade or downgrade subscription plan
   */
  static async changePlan(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      const { planType, period } = req.body;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`Change plan request for user: ${userId}, plan: ${planType}, period: ${period}`);

      const result = await StripeService.changePlan(userId, planType, period);

      return ApiResponseUtil.success(
        res,
        result,
        result.message,
        200
      );
    } catch (error) {
      next(error);
    }
  }

}