/**
 * Enhanced Error Handler
 * Provides better error handling and debugging for development
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError, ValidationError } from '../utils/errors';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] as string;

  // Log detailed error information
  logger.error('API Error Details', {
    requestId,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: (req as any).user,
    timestamp: new Date().toISOString(),
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    const statusCode = err.statusCode || 500;
    const response: any = {
      success: false,
      error: err.code || 'INTERNAL_ERROR',
      message: err.message,
      timestamp: new Date().toISOString(),
      requestId,
    };

    // Include validation details if present
    if (err instanceof ValidationError && err.details) {
      response.details = err.details;
    }

    // Include additional debugging info in development
    if (process.env.NODE_ENV === 'development') {
      response.debug = {
        stack: err.stack,
        body: req.body,
        params: req.params,
        query: req.query,
      };
    }

    return res.status(statusCode).json(response);
  }

  // Handle database connection errors specifically
  if (
    err.message &&
    (err.message.includes('Login failed') ||
      err.message.includes('Connection') ||
      err.message.includes('timeout') ||
      err.message.includes('ENOTFOUND') ||
      err.message.includes('ECONNREFUSED'))
  ) {
    logger.error('Database Connection Error', {
      requestId,
      error: err.message,
      stack: err.stack,
    });

    return res.status(503).json({
      success: false,
      error: 'DATABASE_CONNECTION_ERROR',
      message:
        'Database connection failed. Please check database configuration and ensure SQL Server is running.',
      timestamp: new Date().toISOString(),
      requestId,
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          error: err.message,
          stack: err.stack,
          suggestion:
            'Check if SQL Server is running and database exists. Run setup-dev-db.sql to create development database.',
        },
      }),
    });
  }

  // Handle JWT errors specifically
  if (err.message && err.message.includes('jwt')) {
    logger.error('JWT Authentication Error', {
      requestId,
      error: err.message,
    });

    return res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: 'Authentication failed. Please check your credentials.',
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  // Generic server error
  const statusCode = (err as any).statusCode || 500;
  const response: any = {
    success: false,
    error: 'INTERNAL_ERROR',
    message:
      process.env.NODE_ENV === 'development' ? err.message : 'An internal server error occurred',
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Include debugging info in development
  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      stack: err.stack,
      body: req.body,
      params: req.params,
      query: req.query,
    };
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;

  logger.warn('Route not found', {
    requestId,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
    requestId,
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
