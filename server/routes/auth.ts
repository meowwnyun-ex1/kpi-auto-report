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

      const user = result.recordset[0] as User;

      // Fetch all department access for managers (can have multiple departments)
      let departmentAccess: string[] = [];
      if (user.role === 'manager') {
        const accessResult = await db.request().input('userId', user.id).query(`
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

      logger.info('User logged in', { userId: user.id, username: user.username, departmentAccess });

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

    const result = await db.request().input('userId', req.user!.userId).query(`
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
          SELECT ID as dept_id, Section_name as name_en FROM dept_master WHERE is_active = 1
        `);
        for (const d of spoResult.recordset) {
          if (!deptMap.has(d.dept_id)) deptMap.set(d.dept_id, d.name_en);
        }
      } catch (spoError: unknown) {
        logger.warn(
          'SPO_Dev database unavailable for /department-access',
          spoError as Record<string, unknown>
        );
      }

      const result = await db.request().query(`
        SELECT uda.id, uda.user_id, uda.department_id, uda.access_level, uda.granted_at,
               u.username
        FROM user_department_access uda
        INNER JOIN users u ON uda.user_id = u.id
        ORDER BY u.username
      `);

      // Add department names
      const dataWithDept = result.recordset.map((r: any) => ({
        ...r,
        department_name: deptMap.get(r.department_id) || r.department_id,
      }));

      res.json({
        success: true,
        data: dataWithDept,
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

      const db = await getKpiDb();

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
      const db = await getKpiDb();

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

/**
 * @route POST /api/auth/request-otp
 * @desc Request OTP for password change
 * @access Private - Authenticated users
 */
router.post(
  '/request-otp',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const db = await getKpiDb();

      // Get user email
      const userResult = await db.request().input('userId', userId).query(`
        SELECT email, full_name FROM users WHERE id = @userId AND is_active = 1
      `);

      if (userResult.recordset.length === 0) {
        return next(new AuthenticationError('User not found'));
      }

      const user = userResult.recordset[0];

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Delete any existing OTPs for this user
      await db.request().input('userId', userId).query(`
        DELETE FROM password_reset_otps WHERE user_id = @userId
      `);

      // Store OTP
      await db
        .request()
        .input('userId', userId)
        .input('otpHash', otpHash)
        .input('expiresAt', expiresAt).query(`
        INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
        VALUES (@userId, @otpHash, @expiresAt)
      `);

      // Send email (log for now, implement actual email sending)
      logger.info('OTP generated', { userId, email: user.email, otp });

      // TODO: Send actual email
      // For development, we log the OTP
      console.log(`\n========================================`);
      console.log(`OTP for ${user.email}: ${otp}`);
      console.log(`========================================\n`);

      res.json({
        success: true,
        message: 'OTP sent to your email',
        // For development only - remove in production
        dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      });
    } catch (error) {
      logger.error('Request OTP error', error);
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/verify-otp
 * @desc Verify OTP for password change
 * @access Private - Authenticated users
 */
router.post('/verify-otp', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { otp } = req.body;
    const userId = req.user!.userId;

    if (!otp || otp.length !== 6) {
      return next(new AuthenticationError('Invalid OTP format'));
    }

    const db = await getKpiDb();

    // Get stored OTP
    const otpResult = await db.request().input('userId', userId).query(`
        SELECT id, otp_hash, expires_at, used
        FROM password_reset_otps
        WHERE user_id = @userId AND used = 0
        ORDER BY created_at DESC
      `);

    if (otpResult.recordset.length === 0) {
      return next(new AuthenticationError('No valid OTP found. Please request a new one.'));
    }

    const storedOtp = otpResult.recordset[0];

    // Check expiration
    if (new Date() > new Date(storedOtp.expires_at)) {
      return next(new AuthenticationError('OTP has expired. Please request a new one.'));
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, storedOtp.otp_hash);
    if (!isValid) {
      return next(new AuthenticationError('Invalid OTP'));
    }

    // Mark OTP as used
    await db.request().input('id', storedOtp.id).query(`
        UPDATE password_reset_otps SET used = 1 WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    logger.error('Verify OTP error', error);
    next(error);
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password after OTP verification
 * @access Private - Authenticated users
 */
router.post(
  '/reset-password',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { new_password, otp } = req.body;
      const userId = req.user!.userId;

      if (!new_password || new_password.length < 6) {
        return next(new AuthenticationError('Password must be at least 6 characters'));
      }

      const db = await getKpiDb();

      // Verify OTP was used (already verified)
      const otpResult = await db.request().input('userId', userId).query(`
        SELECT id FROM password_reset_otps
        WHERE user_id = @userId AND used = 1
        ORDER BY created_at DESC
      `);

      if (otpResult.recordset.length === 0) {
        return next(new AuthenticationError('Please verify OTP first'));
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(new_password, 10);

      // Update password
      await db.request().input('userId', userId).input('passwordHash', passwordHash).query(`
        UPDATE users SET password_hash = @passwordHash, updated_at = GETDATE()
        WHERE id = @userId
      `);

      // Delete used OTPs
      await db.request().input('userId', userId).query(`
        DELETE FROM password_reset_otps WHERE user_id = @userId
      `);

      logger.info('Password reset successful', { userId });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Reset password error', error);
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/create-super-admin
 * @desc Temporary endpoint to create Super@Admin user
 * @access Public (temporary for setup)
 */
router.post('/create-super-admin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getKpiDb();

    // Check if user already exists
    const checkResult = await db
      .request()
      .input('username', 'Super@Admin')
      .query(`SELECT id FROM users WHERE username = @username`);

    if (checkResult.recordset.length > 0) {
      // Update existing user
      const hashedPassword = await bcrypt.hash('i@NN636195', 10);

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
      const hashedPassword = await bcrypt.hash('i@NN636195', 10);

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
