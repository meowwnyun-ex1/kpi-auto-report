/**
 * Enterprise API Response Standard
 * World-class standardized response structure
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse, PaginatedResponse, ValidationError } from '../types/unified-kpi';

// ============================================
// STANDARD RESPONSE BUILDERS
// ============================================

export class ResponseBuilder {
  /**
   * Success response with data
   */
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString(),
      request_id: res.locals.requestId,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Success response with pagination
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string,
    statusCode: number = 200
  ): Response {
    const total_pages = Math.ceil(pagination.total / pagination.limit);

    const response: PaginatedResponse<T> = {
      success: true,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        total_pages,
        has_next: pagination.page < total_pages,
        has_prev: pagination.page > 1,
      },
      ...(message && { message }),
      timestamp: new Date().toISOString(),
      request_id: res.locals.requestId,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Error response
   */
  static error(res: Response, error: string, statusCode: number = 400): Response {
    const response: ApiResponse = {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      request_id: res.locals.requestId,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Validation error response
   */
  static validationError(
    res: Response,
    errors: ValidationError[],
    message: string = 'Validation failed'
  ): Response {
    const response: any = {
      success: false,
      error: 'VALIDATION_ERROR',
      message,
      details: errors,
      timestamp: new Date().toISOString(),
      request_id: res.locals.requestId,
    };
    return res.status(422).json(response);
  }

  /**
   * Not found response
   */
  static notFound(res: Response, resource: string = 'Resource', id?: string | number): Response {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    return this.error(res, message, 404);
  }

  /**
   * Unauthorized response
   */
  static unauthorized(res: Response, message: string = 'Unauthorized access'): Response {
    return this.error(res, message, 401);
  }

  /**
   * Forbidden response
   */
  static forbidden(res: Response, message: string = 'Access forbidden'): Response {
    return this.error(res, message, 403);
  }

  /**
   * Server error response
   */
  static serverError(res: Response, error: string = 'Internal server error'): Response {
    return this.error(res, error, 500);
  }
}

// ============================================
// MIDDLEWARE FOR STANDARDIZED RESPONSES
// ============================================

/**
 * Response middleware to attach requestId to response locals
 */
export const responseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.locals.requestId = req.headers['x-request-id'] as string;
  next();
};

/**
 * Standard error handler middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = res.locals.requestId;

  // Log error details
  console.error(`[${requestId}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle known error types
  if (err.name === 'ValidationError') {
    return ResponseBuilder.validationError(res, [
      {
        field: 'general',
        message: err.message,
        code: 'VALIDATION_ERROR',
      },
    ]);
  }

  if (err.name === 'UnauthorizedError') {
    return ResponseBuilder.unauthorized(res, err.message);
  }

  if (err.name === 'ForbiddenError') {
    return ResponseBuilder.forbidden(res, err.message);
  }

  if (err.name === 'NotFoundError') {
    return ResponseBuilder.notFound(res, 'Resource');
  }

  // Generic server error
  return ResponseBuilder.serverError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  );
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format database results to match unified model
 */
export const formatDatabaseResult = <T extends Record<string, any>>(
  result: any,
  fieldMapping?: Partial<Record<keyof T, string>>
): T => {
  if (!result) return {} as T;

  const formatted: any = {};

  // Apply field mapping if provided
  if (fieldMapping) {
    Object.entries(fieldMapping).forEach(([unifiedField, dbField]) => {
      if (result.hasOwnProperty(dbField)) {
        formatted[unifiedField] = result[dbField];
      }
    });
  }

  // Copy remaining fields
  Object.keys(result).forEach((key) => {
    if (!formatted.hasOwnProperty(key)) {
      // Convert snake_case to camelCase for consistency
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      formatted[camelKey] = result[key];
    }
  });

  return formatted as T;
};

/**
 * Build pagination query parameters
 */
export const buildPaginationParams = (query: any) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Build sort parameters
 */
export const buildSortParams = (query: any, allowedFields: string[]) => {
  const sortBy = query.sortBy || 'created_at';
  const sortOrder = query.sortOrder || 'desc';

  if (!allowedFields.includes(sortBy)) {
    throw new Error(`Invalid sort field: ${sortBy}. Allowed fields: ${allowedFields.join(', ')}`);
  }

  return {
    field: sortBy,
    direction: sortOrder as 'asc' | 'desc',
  };
};

/**
 * Validate request body against schema
 */
export const validateRequestBody = (
  body: any,
  requiredFields: string[],
  optionalFields: string[] = []
): { isValid: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];

  // Check required fields
  requiredFields.forEach((field) => {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push({
        field,
        message: `${field} is required`,
        code: 'REQUIRED_FIELD',
      });
    }
  });

  // Check for unexpected fields
  const allowedFields = [...requiredFields, ...optionalFields];
  Object.keys(body).forEach((field) => {
    if (!allowedFields.includes(field)) {
      errors.push({
        field,
        message: `${field} is not allowed`,
        code: 'UNEXPECTED_FIELD',
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================
// COMMON RESPONSE TEMPLATES
// ============================================

export const CommonResponses = {
  // Success messages
  created: (res: Response, data: any, resource: string) =>
    ResponseBuilder.success(res, data, `${resource} created successfully`, 201),

  updated: (res: Response, data: any, resource: string) =>
    ResponseBuilder.success(res, data, `${resource} updated successfully`),

  deleted: (res: Response, resource: string) =>
    ResponseBuilder.success(res, null, `${resource} deleted successfully`),

  approved: (res: Response, data: any, resource: string) =>
    ResponseBuilder.success(res, data, `${resource} approved successfully`),

  rejected: (res: Response, data: any, resource: string, reason?: string) =>
    ResponseBuilder.success(res, data, `${resource} rejected${reason ? `: ${reason}` : ''}`),

  // Error messages
  invalidId: (res: Response, id: string) => ResponseBuilder.error(res, `Invalid ID: ${id}`, 400),

  duplicateEntry: (res: Response, field: string, value: any) =>
    ResponseBuilder.error(res, `Duplicate entry for ${field}: ${value}`, 409),

  invalidStatus: (res: Response, status: string, allowedStatuses: string[]) =>
    ResponseBuilder.error(
      res,
      `Invalid status '${status}'. Allowed: ${allowedStatuses.join(', ')}`,
      400
    ),

  fileUploadError: (res: Response, error: string) =>
    ResponseBuilder.error(res, `File upload error: ${error}`, 400),

  databaseError: (res: Response, operation: string) =>
    ResponseBuilder.serverError(res, `Database error during ${operation}`),

  rateLimitExceeded: (res: Response) =>
    ResponseBuilder.error(res, 'Too many requests. Please wait a moment and try again.', 429),
};
