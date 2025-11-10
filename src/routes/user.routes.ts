import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema } from '../validators/auth.validator';

const router = Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private (requires authentication)
 */
router.get('/profile', authenticate, UserController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private (requires authentication)
 */
router.put('/profile', authenticate, validate(updateProfileSchema), UserController.updateProfile);

/**
 * @route   GET /api/users/subscription
 * @desc    Get user subscription
 * @access  Private (requires authentication)
 */
router.get('/subscription', authenticate, UserController.getSubscription);

/**
 * @route   GET /api/users/billing
 * @desc    Get user billing details (invoices)
 * @access  Private (requires authentication)
 */
router.get('/billing', authenticate, UserController.getBillingDetails);

export default router;