import { Response, NextFunction } from 'express';
import { IAPService } from '../services/iap.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import type { AuthRequest } from '../types';

export class IAPController {

  /**
   * POST /api/iap/verify
   * Verify receipt from Apple/Google and activate subscription
   */
  static async verifyReceipt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      const { receipt, platform, productId, packageName } = req.body;

      logger.info(`IAP verify receipt request for user: ${userId}, platform: ${platform}`);

      const result = await IAPService.verifyReceipt(
        userId,
        receipt,
        platform,
        productId,
        packageName
      );

      return ApiResponseUtil.success(
        res,
        result,
        result.alreadyProcessed
          ? 'Transaction already processed'
          : 'Subscription activated successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/iap/status
   * Get current subscription status
   */
  static async getSubscriptionStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`IAP subscription status request for user: ${userId}`);

      const result = await IAPService.getSubscriptionStatus(userId);

      return ApiResponseUtil.success(
        res,
        result,
        'Subscription status retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/iap/restore
   * Restore purchase after app reinstall
   */
  static async restorePurchase(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      const { receipt, platform, productId, packageName } = req.body;

      logger.info(`IAP restore purchase request for user: ${userId}, platform: ${platform}`);

      const result = await IAPService.restorePurchase(
        userId,
        receipt,
        platform,
        productId,
        packageName
      );

      return ApiResponseUtil.success(
        res,
        result,
        'Purchase restored successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/iap/cancel
   * Cancel subscription (marks DB — store handles actual billing)
   */
  static async cancelSubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      logger.info(`IAP cancel subscription request for user: ${userId}`);

      const result = await IAPService.cancelSubscription(userId);

      return ApiResponseUtil.success(
        res,
        { expiryDate: result.expiryDate },
        result.message,
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/iap/webhooks/apple
   * Apple server notifications — public endpoint (no auth)
   */
  static async handleAppleWebhook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      logger.info('Apple webhook received');

      // Always respond 200 immediately — Apple retries if we don't
      res.status(200).send('OK');

      // Process async after responding
      await IAPService.handleAppleWebhook(req.body);
    } catch (error) {
      logger.error('Apple webhook processing error');
      // Don't call next(error) — we already sent 200 to Apple
    }
  }

  /**
   * POST /api/iap/webhooks/google
   * Google Pub/Sub notifications — public endpoint (no auth)
   */
  static async handleGoogleWebhook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      logger.info('Google webhook received');

      // Always respond 200 immediately — Google retries if we don't
      res.status(200).send('OK');

      // Process async after responding
      await IAPService.handleGoogleWebhook(req.body.message);
    } catch (error) {
      logger.error('Google webhook processing error');
      // Don't call next(error) — we already sent 200 to Google
    }
  }
}