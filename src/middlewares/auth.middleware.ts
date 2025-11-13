import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/ApiError';
import { JWTUtil } from '../utils/jwt';
import { Plan } from '../constants/enums';
import { logger } from '../utils/logger';

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('No token provided');
    }

    // Verify token
    const payload = JWTUtil.verifyAccessToken(token);

    // Attach user to request
    req.user = {
      id: payload.id,
      email: payload.email,
      plan: payload.plan,
    };

    logger.debug('User authenticated', { userId: payload.id });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has premium plan
 */
export const requirePremium = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    
    if (req.user.plan !== Plan.PREMIUM) {
      throw ApiError.forbidden('Premium subscription required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't throw error if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const payload = JWTUtil.verifyAccessToken(token);
        req.user = {
          id: payload.id,
          email: payload.email,
          plan: payload.plan,
        };
      }
    }

    next();
  } catch (error) {
    // Don't throw error, just continue without user
    next();
  }
};