import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { logger } from '../utils/logger';

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'hod' | 'hos' | 'user' | 'guest';

export interface JwtPayload {
  userId: number;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  departmentAccess?: string[];
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Create a guest user object for unauthenticated requests
 */
export const createGuestUser = (): JwtPayload => ({
  userId: 0,
  username: 'guest',
  role: 'guest',
});

/**
 * Middleware that allows both authenticated and guest users.
 * For guest users, attaches a guest user object to req.user.
 * Use this for routes that should be viewable without login.
 */
export const allowGuest = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token - treat as guest
    req.user = createGuestUser();
    return next();
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    req.user = createGuestUser();
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    // Invalid token - treat as guest
    req.user = createGuestUser();
    next();
  }
};

/**
 * Middleware that requires a valid JWT token.
 * Attaches decoded payload to req.user.
 * Enhanced with better error handling and security checks.
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No authentication token provided');
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      logger.error('JWT_SECRET is not configured');
      throw new AuthenticationError('Server authentication configuration error');
    }

    if (jwtSecret === 'CHANGE_ME_TO_A_STRONG_RANDOM_SECRET_MINIMUM_32_CHARACTERS') {
      logger.error('JWT_SECRET is using the default placeholder value');
      throw new AuthenticationError('Server authentication not properly configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token has expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else if (error instanceof jwt.NotBeforeError) {
      next(new AuthenticationError('Token not active'));
    } else {
      logger.error('Unexpected authentication error:', error);
      next(new AuthenticationError('Authentication failed'));
    }
  }
};

/**
 * Middleware that optionally attaches user if token is present.
 * Does NOT reject requests without a token.
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    // Token invalid/expired — proceed without user
    next();
  }
};

/**
 * Middleware factory that requires a specific role.
 * Must be used AFTER requireAuth.
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AuthorizationError(`Role '${req.user.role}' does not have access to this resource`)
      );
    }

    next();
  };
};

/**
 * Middleware that requires at least manager role.
 * Blocks guests and regular users.
 */
export const requireManager = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  const allowedRoles: UserRole[] = ['superadmin', 'admin', 'manager'];
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AuthorizationError('Manager role required'));
  }

  next();
};

// Alias for requireAuth
export const authenticateToken = requireAuth;
