import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import type { AuthRequest } from '../types';
import config from '../config';
import { ApiError } from '../utils/ApiError';
import { JWTUtil } from '../utils/jwt';
import { RevocationService } from '../utils/redis';

/**
 * Auth Controller - Handles HTTP requests for authentication
 */
export class AuthController {
  /**
   * POST /api/auth/signup
   * Register new user
   */
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password, referralCode } = req.body;

      logger.info(`Signup request received for: ${email}`);

      const result = await AuthService.signup(firstName, lastName, email, password, referralCode);

      return ApiResponseUtil.success(
        res,
        undefined,
        result.message,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * User login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      logger.info(`Login request received for: ${email}`);

      const result = await AuthService.login(email, password);

      // Set HttpOnly cookies
      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ApiResponseUtil.success(
        res,
        result,
        'Logged in successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
     * POST /api/auth/verify-email
     * Verify email with OTP and auto sign-in
     */
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;

      logger.info(`Email verification request received for: ${email}`);

      const result = await AuthService.verifyEmail(email, otp);

      // Set HttpOnly cookies (auto sign-in)
      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ApiResponseUtil.success(
        res,
        { user: result.user, tokens: result.tokens },
        result.message,
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/resend-otp
   * Resend verification OTP
   */
  static async resendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      logger.info(`Resend OTP request for: ${email}`);

      const result = await AuthService.resendOTP(email);

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
   * POST /api/auth/forgot-password
   * Send password reset email
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      logger.info(`Forgot password request for: ${email}`);

      const result = await AuthService.forgotPassword(email);

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
   * POST /api/auth/verify-reset-token
   * Verify password reset token
   */
  static async verifyResetToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      logger.info('Reset token verification request');

      const result = await AuthService.verifyResetToken(token);

      return ApiResponseUtil.success(
        res,
        { user: result.user },
        result.message,
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/change-password
   * Change/Reset password
   */
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, password } = req.body;

      logger.info(`Password change request for user: ${userId}`);

      const result = await AuthService.changePassword(userId, password);

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
   * POST /api/auth/refresh-token
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      let refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        refreshToken = req.body.refreshToken;
      }

      if (!refreshToken) {
        throw ApiError.unauthorized('Refresh token not found');
      }

      logger.info('Token refresh request');

      const result = await AuthService.refreshToken(refreshToken);

      // Set new access token
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });


      return ApiResponseUtil.success(
        res,
        result,
        'Token refreshed successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user (client-side token removal)
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Logout request');

      // Revoke this specific token so Server A rejects it immediately,
      // instead of waiting for natural expiry.
      const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
      if (token) {
        const payload = JWTUtil.decode(token);
        if (payload?.jti && payload?.exp) {
          await RevocationService.revokeToken(payload.jti, payload.exp);
        }
      }

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      // In a stateless JWT system, logout is handled client-side
      // But we can log the event and potentially blacklist tokens if needed

      return ApiResponseUtil.success(
        res,
        undefined,
        'Logged out successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }


  /**
 * POST /api/auth/logout-all
 * Revoke ALL of the user's tokens (logout from every device)
 */
  static async logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized('Authentication required');
      }

      logger.info(`Logout-all request for user: ${req.user.id}`);

      await RevocationService.revokeAllForUser(req.user.id);

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return ApiResponseUtil.success(res, undefined, 'Logged out of all devices successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}