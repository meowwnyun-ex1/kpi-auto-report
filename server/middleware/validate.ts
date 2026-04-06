import { Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { ValidationError } from '../utils/errors';

type RequestLocation = 'body' | 'query' | 'params';

/**
 * Express middleware factory that validates request data against a Zod schema.
 * On success, replaces the request property with the parsed (and coerced) data.
 * On failure, passes a ValidationError to the next error handler.
 */
export const validate = (schema: z.ZodType, location: RequestLocation = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[location];
      const parsed = schema.parse(data);
      // Replace with parsed & coerced data
      (req as unknown as Record<string, unknown>)[location] = parsed;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.') || '_root';
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(issue.message);
        }
        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
};
