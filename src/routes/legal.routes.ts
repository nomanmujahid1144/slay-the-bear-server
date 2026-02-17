import { Router } from 'express';
import { LegalController } from '../controllers/legal.controller';

const router = Router();

/**
 * @route   GET /api/legal/terms-of-service
 * @desc    Get Terms of Service
 * @access  Public
 */
router.get('/terms-of-service', LegalController.getTermsOfService);

/**
 * @route   GET /api/legal/privacy-policy
 * @desc    Get Privacy Policy
 * @access  Public
 */
router.get('/privacy-policy', LegalController.getPrivacyPolicy);

export default router;