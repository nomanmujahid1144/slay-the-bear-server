import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import type { AuthRequest } from '../types';
import config from '../config';
import { ApiError } from '../utils/ApiError';

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
      const { firstName, lastName, email, password } = req.body;

      logger.info(`Signup request received for: ${email}`);

      const result = await AuthService.signup(firstName, lastName, email, password);

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
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
   * Verify email with token
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      logger.info('Email verification request received');

      const result = await AuthService.verifyEmail(token);

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
        sameSite: 'strict',
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
}