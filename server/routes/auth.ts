import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAppStoreDb } from '../config/database';
import { User } from '../types';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { loginSchema } from '../utils/validation-schemas';
import { AuthenticationError, DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token
 * @access Public
 */
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = await getAppStoreDb();
      const { username, password } = req.body;

      const result = await db.request().input('username', username).query(`
        SELECT id, username, email, password_hash, full_name, role, is_active
        FROM users 
        WHERE username = @username AND is_active = 1
      `);

      if (result.recordset.length === 0) {
        logger.warn('Login attempt with invalid username', { username });
        return next(new AuthenticationError('Invalid credentials'));
      }

      const user = result.recordset[0] as User;

      const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
      if (!isPasswordValid) {
        logger.warn('Login attempt with invalid password', { username, userId: user.id });
        return next(new AuthenticationError('Invalid credentials'));
      }

      // Update last login (non-critical, continue on error)
      try {
        await db.request().input('id', user.id).query(`
          UPDATE users 
          SET last_login = GETDATE() 
          WHERE id = @id
        `);
      } catch (updateError) {
        logger.warn('Could not update last_login', { userId: user.id, error: updateError });
      }

      // JWT_SECRET must be configured in production
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET is not configured');
        return next(new DatabaseError('Server authentication configuration error'));
      }

      if (jwtSecret === 'CHANGE_ME_TO_A_STRONG_RANDOM_SECRET_MINIMUM_32_CHARACTERS') {
        logger.error('JWT_SECRET is using the default placeholder value');
        return next(new DatabaseError('Server authentication not properly configured'));
      }

      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
        },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
      );

      const { password_hash, ...userWithoutPassword } = user;

      logger.info('User logged in', { userId: user.id, username: user.username });

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          token,
        },
        message: 'Login successful',
      });
    } catch (error) {
      logger.error('Auth login error', error);
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Public
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user profile
 * @access Private
 */
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getAppStoreDb();

    const result = await db.request().input('userId', req.user!.userId).query(`
        SELECT id, username, email, full_name, role, is_active, created_at
        FROM users 
        WHERE id = @userId AND is_active = 1
      `);

    if (result.recordset.length === 0) {
      return next(new AuthenticationError('User not found or inactive'));
    }

    const user = result.recordset[0] as User;

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Auth me error', error);
    next(error);
  }
});

export default router;
