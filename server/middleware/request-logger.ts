import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware that logs every HTTP request with method, URL, status code, duration, and request ID.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string | undefined;

  // Set request ID in response header for client-side tracing
  if (requestId) {
    res.setHeader('X-Request-ID', requestId);
  }

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req.method, req.originalUrl, res.statusCode, duration, requestId);
  });

  next();
};
