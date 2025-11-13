import { Router } from 'express';
import { StripeController } from '../controllers/stripe.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';
import { createCheckoutSchema } from '../validators/stripe.validator';

const router = Router();

/**
 * @route   POST /api/stripe/create-checkout-session
 * @desc    Create Stripe checkout session
 * @access  Private (requires authentication)
 */
router.post(
  '/create-checkout-session',
  authenticate,
  validate(createCheckoutSchema),
  StripeController.createCheckoutSession
);

/**
 * @route   GET /api/stripe/session/:sessionId
 * @desc    Get checkout session details
 * @access  Public (for success page)
 */
router.get('/session/:sessionId', StripeController.getSessionDetails);

/**
 * @route   POST /api/stripe/cancel-subscription
 * @desc    Cancel subscription
 * @access  Private (requires authentication)
 */
router.post(
  '/cancel-subscription',
  authenticate,
  StripeController.cancelSubscription
);

/**
 * @route   POST /api/stripe/reactivate-subscription
 * @desc    Reactivate canceled subscription
 * @access  Private (requires authentication)
 */
router.post(
  '/reactivate-subscription',
  authenticate,
  StripeController.reactivateSubscription
);

/**
 * @route   GET /api/stripe/customer-portal
 * @desc    Get Stripe customer portal URL
 * @access  Private (requires authentication)
 */
router.get('/customer-portal', authenticate, StripeController.getCustomerPortal);

export default router;