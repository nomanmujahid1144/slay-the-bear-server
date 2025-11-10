import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  signUpSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  verifyResetTokenSchema,
  changePasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post('/signup', validate(signUpSchema), AuthController.signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginSchema), AuthController.login);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);

/**
 * @route   POST /api/auth/verify-reset-token
 * @desc    Verify password reset token
 * @access  Public
 */
router.post('/verify-reset-token', validate(verifyResetTokenSchema), AuthController.verifyResetToken);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change/reset password
 * @access  Public
 */
router.post('/change-password', validate(changePasswordSchema), AuthController.changePassword);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', AuthController.logout);

export default router;