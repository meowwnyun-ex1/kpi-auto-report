import validator from 'validator';
import { Request, Response, NextFunction } from 'express';

// Sanitize HTML content to prevent XSS (simplified for KPI - no rich text needed)
export const sanitizeHtml = (content: string): string => {
  if (!content || typeof content !== 'string') return '';
  // KPI system doesn't need rich HTML - just escape all HTML
  return validator.escape(content);
};

// Sanitize string input
export const sanitizeString = (
  input: string,
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    trim?: boolean;
  } = {}
): string => {
  if (!input || typeof input !== 'string') return '';

  const { maxLength = 1000, allowHtml = false, trim = true } = options;

  let sanitized = input;

  if (trim) {
    sanitized = sanitized.trim();
  }

  if (!allowHtml) {
    sanitized = validator.escape(sanitized);
  }

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

// Validate and sanitize email
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';

  const sanitized = email.trim().toLowerCase();
  return validator.isEmail(sanitized) ? sanitized : '';
};

// Validate and sanitize URL
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';

  const sanitized = url.trim();
  // Allow valid http/https URLs through; for other values, strip dangerous chars but preserve the value
  // (Zod schema handles strict validation; sanitizer only prevents injection)
  if (validator.isURL(sanitized, { protocols: ['http', 'https'], require_protocol: false })) {
    return sanitized;
  }
  // Fallback: escape the value rather than silently dropping it
  return validator.escape(sanitized);
};

// Validate and sanitize numeric input
export const sanitizeNumber = (
  input: unknown,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): number | null => {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, integer = false } = options;

  let num = parseFloat(String(input));

  if (isNaN(num)) return null;

  if (integer) num = Math.floor(num);

  if (num < min || num > max) return null;

  return num;
};

// Middleware to sanitize request body
export const sanitizeMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    if (req.body) {
      // Recursively sanitize object
      const sanitizeObject = (obj: unknown): unknown => {
        if (typeof obj !== 'object' || obj === null) return obj;

        if (Array.isArray(obj)) {
          return obj.map((item) => sanitizeObject(item));
        }

        const sanitized: Record<string, unknown> = {};
        const skipFields = ['password', 'password_hash', 'token', 'authorization'];
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
          if (typeof value === 'string') {
            // Never sanitize sensitive fields - they need exact values
            if (skipFields.includes(key.toLowerCase())) {
              sanitized[key] = value;
            } else if (key.includes('email')) {
              sanitized[key] = sanitizeEmail(value);
            } else if (key === 'url' || key.endsWith('_url')) {
              sanitized[key] = sanitizeUrl(value);
            } else if (key.includes('description') || key.includes('content')) {
              sanitized[key] = sanitizeHtml(value);
            } else {
              sanitized[key] = sanitizeString(value, { maxLength: 5000 });
            }
          } else if (typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };

      req.body = sanitizeObject(req.body);
    }

    next();
  } catch (error) {
    next(new Error('Invalid input data'));
  }
};

// Validate file upload
export const validateFile = (
  file: { size: number; mimetype: string; originalname: string } | undefined | null,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/ico'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.ico'],
  } = options;

  if (!file) return { valid: false, error: 'No file provided' };

  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check file extension
  const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'File extension not allowed' };
  }

  // Check filename for suspicious characters
  const filename = file.originalname;
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return { valid: false, error: 'Filename contains invalid characters' };
  }

  return { valid: true };
};

export default {
  sanitizeHtml,
  sanitizeString,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeNumber,
  sanitizeMiddleware,
  validateFile,
};
