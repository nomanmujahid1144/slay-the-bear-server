import { Router } from 'express';
import { IAPController } from '../controllers/iap.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { verifyReceiptSchema, restorePurchaseSchema } from '../validators/iap.validator';

const router = Router();

/**
 * @route   POST /api/iap/verify
 * @desc    Verify Apple/Google receipt and activate subscription
 * @access  Private (requires authentication)
 */
router.post('/verify', authenticate, validate(verifyReceiptSchema), IAPController.verifyReceipt );

/**
 * @route   GET /api/iap/status
 * @desc    Get current IAP subscription status
 * @access  Private (requires authentication)
 */
router.get('/status', authenticate, IAPController.getSubscriptionStatus );

/**
 * @route   POST /api/iap/restore
 * @desc    Restore purchase after app reinstall
 * @access  Private (requires authentication)
 */
router.post('/restore', authenticate, validate(restorePurchaseSchema), IAPController.restorePurchase );

/**
 * @route   POST /api/iap/cancel
 * @desc    Cancel IAP subscription (marks DB — store handles billing)
 * @access  Private (requires authentication)
 */
router.post('/cancel', authenticate, IAPController.cancelSubscription );

/**
 * @route   POST /api/iap/webhooks/apple
 * @desc    Apple App Store server notifications
 * @access  Public (Apple calls this automatically)
 */
router.post('/webhooks/apple', IAPController.handleAppleWebhook );

/**
 * @route   POST /api/iap/webhooks/google
 * @desc    Google Play server notifications via Pub/Sub
 * @access  Public (Google calls this automatically)
 */
router.post('/webhooks/google', IAPController.handleGoogleWebhook);

export default router;