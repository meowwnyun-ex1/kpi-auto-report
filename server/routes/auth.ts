import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getKpiDb, getSpoDb } from '../config/database';
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
      const db = await getKpiDb();
      const { username, password } = req.body;

      const result = await db.request().input('username', username).query(`
        SELECT id, username, email, password_hash, full_name, role, is_active, 
               department_id, department_name
        FROM users 
        WHERE username = @username AND is_active = 1
      `);

      if (result.recordset.length === 0) {
        logger.warn('Login attempt with invalid username', { username });
        return next(new AuthenticationError('Invalid credentials'));
      }

      const user = result.recordset[0] as any;
      const userId = user.id;

      // Fetch all department access for managers (can have multiple departments)
      let departmentAccess: string[] = [];
      if (user.role === 'manager') {
        const accessResult = await db.request().input('userId', userId).query(`
          SELECT department_id FROM user_department_access WHERE user_id = @userId
        `);
        departmentAccess = accessResult.recordset.map((r: any) => r.department_id);
        // Also include the user's default department_id if not already in the list
        if (user.department_id && !departmentAccess.includes(user.department_id)) {
          departmentAccess.push(user.department_id);
        }
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
      if (!isPasswordValid) {
        logger.warn('Login attempt with invalid password', { username, userId });
        return next(new AuthenticationError('Invalid credentials'));
      }

      // Update last login (non-critical, continue on error)
      try {
        await db.request().input('id', userId).query(`
          UPDATE users 
          SET last_login = GETDATE() 
          WHERE id = @id
        `);
      } catch (updateError) {
        logger.warn('Could not update last_login', { userId, error: updateError });
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
          userId: userId,
          username: user.username,
          role: user.role,
          departmentAccess: departmentAccess.length > 0 ? departmentAccess : undefined,
        },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
      );

      const { password_hash, ...userWithoutPassword } = user;

      // Map SPO dept_id to KPI code if needed
      if (userWithoutPassword.department_id) {
        const kpiMapping = await db
          .request()
          .input('kpi_code', userWithoutPassword.department_id)
          .query(
            `SELECT kpi_code, description FROM kpi_department_mapping WHERE kpi_code = @kpi_code`
          );

        if (kpiMapping.recordset.length === 0) {
          // Not a KPI code, try to find KPI code for this SPO dept_id
          const spoToKpi = await db
            .request()
            .input('spo_dept_id', userWithoutPassword.department_id)
            .query(
              `SELECT kpi_code, description FROM kpi_department_mapping WHERE spo_dept_id = @spo_dept_id`
            );

          if (spoToKpi.recordset.length > 0) {
            userWithoutPassword.department_id = spoToKpi.recordset[0].kpi_code;
            userWithoutPassword.department_name = spoToKpi.recordset[0].description;
          }
        }
      }

      // Add department access to user object for frontend
      (userWithoutPassword as any).department_access = departmentAccess;

      logger.info('User logged in', {
        userId: userId,
        username: user.username,
        departmentAccess,
      });

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
    const db = await getKpiDb();

    const userId = req.user!.userId;
    const result = await db.request().input('userId', userId).query(`
      SELECT id, username, email, full_name, role, is_active, department_id, created_at
      FROM users 
      WHERE id = @userId AND is_active = 1
    `);

    if (result.recordset.length === 0) {
      return next(new AuthenticationError('User not found or inactive'));
    }

    const user = result.recordset[0] as User;

    // Get department info - map SPO dept_id to KPI code
    if (user.department_id) {
      // First check if this is already a KPI code
      const kpiMapping = await db
        .request()
        .input('kpi_code', user.department_id)
        .query(
          `SELECT kpi_code, description FROM kpi_department_mapping WHERE kpi_code = @kpi_code`
        );

      if (kpiMapping.recordset.length > 0) {
        // Already a KPI code
        user.department_name = kpiMapping.recordset[0].description;
      } else {
        // Try to find KPI code for this SPO dept_id
        const spoToKpi = await db
          .request()
          .input('spo_dept_id', user.department_id)
          .query(
            `SELECT kpi_code, description FROM kpi_department_mapping WHERE spo_dept_id = @spo_dept_id`
          );

        if (spoToKpi.recordset.length > 0) {
          // Update to use KPI code
          user.department_id = spoToKpi.recordset[0].kpi_code;
          user.department_name = spoToKpi.recordset[0].description;
        } else {
          // Try SPO_Dev as fallback (optional)
          try {
            const spoDb = await getSpoDb();
            const deptResult = await spoDb
              .request()
              .input('dept_id', user.department_id)
              .query(
                `SELECT ID as dept_id, Section_name as department_name, Company as company FROM dept_master WHERE ID = @dept_id`
              );

            if (deptResult.recordset.length > 0) {
              user.department_name = deptResult.recordset[0].department_name;
              (user as any).company_name = deptResult.recordset[0].company;
            }
          } catch (spoError: unknown) {
            logger.warn(
              'SPO_Dev database unavailable for /me dept lookup',
              spoError as Record<string, unknown>
            );
          }
        }
      }
    }

    // Fetch all department access for managers (can have multiple departments)
    if (user.role === 'manager') {
      const accessResult = await db.request().input('userId', user.id).query(`
        SELECT department_id FROM user_department_access WHERE user_id = @userId
      `);
      const departmentAccess = accessResult.recordset.map((r: any) => r.department_id);
      // Include default department_id if not already in list
      if (user.department_id && !departmentAccess.includes(user.department_id)) {
        departmentAccess.push(user.department_id);
      }
      (user as any).department_access = departmentAccess;
    }

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

    const db = await getKpiDb();

    // Get department names from kpi_department_mapping (primary source)
    const kpiDeptResult = await db.request().query(`
      SELECT kpi_code, spo_dept_id, description FROM kpi_department_mapping
    `);
    const deptMap = new Map<string, string>();
    for (const d of kpiDeptResult.recordset) {
      deptMap.set(d.kpi_code, d.description);
      if (d.spo_dept_id) deptMap.set(d.spo_dept_id, d.description);
    }

    // Try SPO_Dev for enrichment (optional)
    try {
      const spoDb = await getSpoDb();
      const spoResult = await spoDb.request().query(`
        SELECT ID as dept_id, Section_name as name_en FROM dept_master WHERE is_active = 'Active'
      `);
      for (const d of spoResult.recordset) {
        if (!deptMap.has(d.dept_id)) deptMap.set(d.dept_id, d.name_en);
      }
    } catch (spoError: unknown) {
      logger.warn('SPO_Dev database unavailable for /users', spoError as Record<string, unknown>);
    }

    const result = await db.request().query(`
      SELECT id, username, email, full_name, role, is_active, department_id
      FROM users 
      WHERE is_active = 1
      ORDER BY role, username
    `);

    // Add department names
    const usersWithDept = result.recordset.map((u: any) => ({
      ...u,
      department_name: u.department_id ? deptMap.get(u.department_id) || null : null,
    }));

    res.json({
      success: true,
      data: usersWithDept,
    });
  } catch (error) {
    logger.error('Get users error', error);
    next(error);
  }
});

/**
 * @route POST /api/auth/create-super-admin
 * @desc Temporary endpoint to create Super@Admin user
 * @access Public (temporary for setup)
 */
router.post('/create-super-admin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 8 characters',
      });
    }

    const db = await getKpiDb();

    // Check if user already exists
    const checkResult = await db
      .request()
      .input('username', 'Super@Admin')
      .query(`SELECT id FROM users WHERE username = @username`);

    const hashedPassword = await bcrypt.hash(password, 10);

    if (checkResult.recordset.length > 0) {
      // Update existing user
      await db
        .request()
        .input('username', 'Super@Admin')
        .input('password_hash', hashedPassword)
        .input('full_name', 'Super Administrator')
        .input('role', 'superadmin')
        .input('email', 'superadmin@denso.com').query(`
          UPDATE users 
          SET password_hash = @password_hash, 
              full_name = @full_name, 
              role = @role,
              email = @email,
              is_active = 1
          WHERE username = @username
        `);

      logger.info('Updated existing Super@Admin user');
      res.json({ success: true, message: 'User updated successfully' });
    } else {
      // Create new user
      await db
        .request()
        .input('username', 'Super@Admin')
        .input('email', 'superadmin@denso.com')
        .input('password_hash', hashedPassword)
        .input('full_name', 'Super Administrator')
        .input('role', 'superadmin').query(`
          INSERT INTO users (username, email, password_hash, full_name, role, is_active)
          VALUES (@username, @email, @password_hash, @full_name, @role, 1)
        `);

      logger.info('Created new Super@Admin user');
      res.json({ success: true, message: 'User created successfully' });
    }
  } catch (error) {
    logger.error('Create super admin error', error);
    next(error);
  }
});

export default router;
