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

/**
 * @route GET /api/auth/users
 * @desc Get all users (for admin to assign department access)
 * @access Private - Admin only
 */
router.get('/users', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check admin role
    if (!['admin', 'superadmin'].includes(req.user!.role)) {
      return next(new AuthenticationError('Access denied'));
    }

    const db = await getAppStoreDb();

    const result = await db.request().query(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active, u.department_id,
             d.name_en as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.dept_id
      WHERE u.is_active = 1
      ORDER BY u.role, u.username
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    logger.error('Get users error', error);
    next(error);
  }
});

/**
 * @route GET /api/auth/department-access
 * @desc Get all department access assignments
 * @access Private - Admin only
 */
router.get(
  '/department-access',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check admin role
      if (!['admin', 'superadmin'].includes(req.user!.role)) {
        return next(new AuthenticationError('Access denied'));
      }

      const db = await getAppStoreDb();

      const result = await db.request().query(`
      SELECT uda.id, uda.user_id, uda.department_id, uda.access_level, uda.granted_at,
             u.username, d.name_en as department_name
      FROM user_department_access uda
      INNER JOIN users u ON uda.user_id = u.id
      INNER JOIN departments d ON uda.department_id = d.dept_id
      ORDER BY u.username, d.name_en
    `);

      res.json({
        success: true,
        data: result.recordset,
      });
    } catch (error) {
      logger.error('Get department access error', error);
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/department-access
 * @desc Grant department access to a user
 * @access Private - Admin only
 */
router.post(
  '/department-access',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check admin role
      if (!['admin', 'superadmin'].includes(req.user!.role)) {
        return next(new AuthenticationError('Access denied'));
      }

      const { user_id, department_id, access_level } = req.body;

      if (!user_id || !department_id || !access_level) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: user_id, department_id, access_level',
        });
      }

      const db = await getAppStoreDb();

      // Check if access already exists
      const existing = await db
        .request()
        .input('user_id', user_id)
        .input('department_id', department_id).query(`
        SELECT id FROM user_department_access
        WHERE user_id = @user_id AND department_id = @department_id
      `);

      if (existing.recordset.length > 0) {
        // Update existing
        await db
          .request()
          .input('user_id', user_id)
          .input('department_id', department_id)
          .input('access_level', access_level)
          .input('granted_by', req.user!.userId).query(`
          UPDATE user_department_access
          SET access_level = @access_level, granted_at = GETDATE(), granted_by = @granted_by
          WHERE user_id = @user_id AND department_id = @department_id
        `);
      } else {
        // Insert new
        await db
          .request()
          .input('user_id', user_id)
          .input('department_id', department_id)
          .input('access_level', access_level)
          .input('granted_by', req.user!.userId).query(`
          INSERT INTO user_department_access (user_id, department_id, access_level, granted_by)
          VALUES (@user_id, @department_id, @access_level, @granted_by)
        `);
      }

      res.json({
        success: true,
        message: 'Access granted successfully',
      });
    } catch (error) {
      logger.error('Grant department access error', error);
      next(error);
    }
  }
);

/**
 * @route DELETE /api/auth/department-access/:id
 * @desc Revoke department access
 * @access Private - Admin only
 */
router.delete(
  '/department-access/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check admin role
      if (!['admin', 'superadmin'].includes(req.user!.role)) {
        return next(new AuthenticationError('Access denied'));
      }

      const { id } = req.params;
      const db = await getAppStoreDb();

      await db.request().input('id', id).query(`
      DELETE FROM user_department_access WHERE id = @id
    `);

      res.json({
        success: true,
        message: 'Access revoked successfully',
      });
    } catch (error) {
      logger.error('Revoke department access error', error);
      next(error);
    }
  }
);

export default router;
