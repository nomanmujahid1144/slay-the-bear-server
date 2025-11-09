import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import config from '../config';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Convert non-ApiError to ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = 500;
    const message = error.message || 'Internal server error';
    error = new ApiError(statusCode, message, false);
  }

  const apiError = error as ApiError;

  // Log error
  logger.error(`${apiError.statusCode} - ${apiError.message}`, {
    error: apiError.message,
    stack: config.NODE_ENV === 'development' ? apiError.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    body: req.body,
  });

  // Send response
  return ApiResponseUtil.error(
    res,
    apiError.message,
    apiError.statusCode,
    config.NODE_ENV === 'development' ? apiError.stack : undefined
  );
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};