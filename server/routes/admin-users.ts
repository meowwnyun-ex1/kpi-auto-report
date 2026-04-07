import express, { Request, Response, NextFunction } from 'express';
import { getCasDb, getSpoDb, getKpiDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AuthenticationError } from '../utils/errors';
import sql from 'mssql';

const router = express.Router();

// All routes require authentication and admin role
router.use(requireAuth);
router.use((req: Request, _res: Response, next: NextFunction) => {
  if (!['admin', 'superadmin'].includes(req.user!.role)) {
    return next(new AuthenticationError('Access denied'));
  }
  next();
});

/**
 * GET /api/admin/employees/search
 * Search employees from CAS database
 */
router.get('/employees/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, department_id, limit = 20 } = req.query;

    if (!q && !department_id) {
      return res.json({ success: true, data: [] });
    }

    const casDb = await getCasDb();
    const request = casDb.request();

    let query = `
      SELECT TOP(${parseInt(limit as string) || 20})
        employee_id,
        name,
        name_en,
        email,
        is_head,
        department_id,
        is_active,
        position_level_id,
        position_id,
        first_name_en,
        last_name_en,
        first_name_th,
        last_name_th,
        name_title_en,
        name_title_th,
        department_name,
        section_name
      FROM employees
      WHERE is_active = 1
    `;

    if (q) {
      request.input('search', sql.NVarChar, `%${q}%`);
      query += `
        AND (
          employee_id LIKE @search
          OR name LIKE @search
          OR name_en LIKE @search
          OR email LIKE @search
          OR first_name_en LIKE @search
          OR last_name_en LIKE @search
        )
      `;
    }

    if (department_id) {
      request.input('department_id', sql.NVarChar, department_id);
      query += ` AND department_id = @department_id`;
    }

    query += ` ORDER BY name_en`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    logger.error('Failed to search employees', error);
    next(error);
  }
});

/**
 * GET /api/admin/employees/:employee_id
 * Get employee details by ID
 */
router.get('/employees/:employee_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employee_id } = req.params;
    const casDb = await getCasDb();

    const result = await casDb.request().input('employee_id', sql.NVarChar, employee_id).query(`
        SELECT 
          employee_id,
          name,
          name_en,
          email,
          is_head,
          department_id,
          is_active,
          position_level_id,
          position_id,
          report_to_id,
          first_name_en,
          last_name_en,
          first_name_th,
          last_name_th,
          name_title_en,
          name_title_th,
          start_date,
          end_date,
          company_name,
          division_name,
          department_name,
          section_name,
          sub_section_name,
          group_name,
          line_name
        FROM employees
        WHERE employee_id = @employee_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    logger.error('Failed to get employee', error);
    next(error);
  }
});

/**
 * GET /api/admin/spo-departments
 * Get departments from SPO_Dev database
 */
router.get('/spo-departments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const spoDb = await getSpoDb();

    const result = await spoDb.request().query(`
      SELECT 
        dept_id,
        dept_code,
        name_en,
        name_th,
        division,
        is_active
      FROM departments
      WHERE is_active = 1
      ORDER BY name_en
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    logger.error('Failed to get SPO departments', error);
    next(error);
  }
});

/**
 * GET /api/admin/kpi-categories
 * Get KPI categories for assignment
 */
router.get('/kpi-categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kpiDb = await getKpiDb();

    const result = await kpiDb.request().query(`
      SELECT 
        id,
        [key],
        name_en,
        name_th,
        icon,
        color
      FROM kpi_categories
      WHERE is_active = 1
      ORDER BY sort_order
    `);

    // If no categories in DB, return default categories
    if (result.recordset.length === 0) {
      const defaultCategories = [
        {
          key: 'safety',
          name_en: 'Safety',
          name_th: 'ความปลอดภัย',
          icon: 'Shield',
          color: '#EF4444',
        },
        { key: 'quality', name_en: 'Quality', name_th: 'คุณภาพ', icon: 'Award', color: '#3B82F6' },
        {
          key: 'delivery',
          name_en: 'Delivery',
          name_th: 'การส่งมอบ',
          icon: 'Truck',
          color: '#10B981',
        },
        {
          key: 'compliance',
          name_en: 'Compliance',
          name_th: 'การปฏิบัติตาม',
          icon: 'FileCheck',
          color: '#8B5CF6',
        },
        { key: 'hr', name_en: 'HR', name_th: 'ทรัพยากรบุคคล', icon: 'Users', color: '#F59E0B' },
        {
          key: 'attractive',
          name_en: 'Attractive',
          name_th: 'ความน่าสนใจ',
          icon: 'Star',
          color: '#EC4899',
        },
        {
          key: 'environment',
          name_en: 'Environment',
          name_th: 'สิ่งแวดล้อม',
          icon: 'Leaf',
          color: '#22C55E',
        },
        { key: 'cost', name_en: 'Cost', name_th: 'ต้นทุน', icon: 'DollarSign', color: '#6366F1' },
      ];
      return res.json({ success: true, data: defaultCategories });
    }

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    logger.error('Failed to get KPI categories', error);
    next(error);
  }
});

/**
 * POST /api/admin/managers
 * Create a new manager user from employee
 */
router.post('/managers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employee_id, role = 'manager', department_access = [], kpi_categories = [] } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
      });
    }

    // Get employee from CAS
    const casDb = await getCasDb();
    const employeeResult = await casDb.request().input('employee_id', sql.NVarChar, employee_id)
      .query(`
        SELECT employee_id, name_en, email, department_id
        FROM employees
        WHERE employee_id = @employee_id AND is_active = 1
      `);

    if (employeeResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or inactive',
      });
    }

    const employee = employeeResult.recordset[0];

    // Check if user already exists
    const kpiDb = await getKpiDb();
    const existingUser = await kpiDb
      .request()
      .input('employee_id', sql.NVarChar, employee_id)
      .query(`SELECT id, username, role FROM users WHERE username = @employee_id`);

    if (existingUser.recordset.length > 0) {
      // Update existing user
      await kpiDb
        .request()
        .input('employee_id', sql.NVarChar, employee_id)
        .input('role', sql.NVarChar, role)
        .input('department_id', sql.NVarChar, employee.department_id).query(`
          UPDATE users 
          SET role = @role, department_id = @department_id, updated_at = GETDATE()
          WHERE username = @employee_id
        `);

      // Clear existing department access
      await kpiDb
        .request()
        .input('user_id', sql.Int, existingUser.recordset[0].id)
        .query(`DELETE FROM user_department_access WHERE user_id = @user_id`);

      // Add new department access
      for (const access of department_access) {
        await kpiDb
          .request()
          .input('user_id', sql.Int, existingUser.recordset[0].id)
          .input('department_id', sql.NVarChar, access.department_id)
          .input('access_level', sql.NVarChar, access.access_level || 'edit')
          .input('granted_by', sql.Int, req.user!.userId).query(`
            INSERT INTO user_department_access (user_id, department_id, access_level, granted_by)
            VALUES (@user_id, @department_id, @access_level, @granted_by)
          `);
      }

      return res.json({
        success: true,
        message: 'Manager updated successfully',
        data: {
          id: existingUser.recordset[0].id,
          username: employee_id,
          name: employee.name_en,
          role,
        },
      });
    }

    // Create new user (default password = employee_id)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(employee_id, 10);

    const insertResult = await kpiDb
      .request()
      .input('username', sql.NVarChar, employee_id)
      .input('email', sql.NVarChar, employee.email || `${employee_id}@denso.com`)
      .input('password_hash', sql.NVarChar, hashedPassword)
      .input('full_name', sql.NVarChar, employee.name_en)
      .input('role', sql.NVarChar, role)
      .input('department_id', sql.NVarChar, employee.department_id).query(`
        INSERT INTO users (username, email, password_hash, full_name, role, department_id)
        OUTPUT INSERTED.id
        VALUES (@username, @email, @password_hash, @full_name, @role, @department_id)
      `);

    const newUserId = insertResult.recordset[0].id;

    // Add department access
    for (const access of department_access) {
      await kpiDb
        .request()
        .input('user_id', sql.Int, newUserId)
        .input('department_id', sql.NVarChar, access.department_id)
        .input('access_level', sql.NVarChar, access.access_level || 'edit')
        .input('granted_by', sql.Int, req.user!.userId).query(`
          INSERT INTO user_department_access (user_id, department_id, access_level, granted_by)
          VALUES (@user_id, @department_id, @access_level, @granted_by)
        `);
    }

    res.json({
      success: true,
      message: 'Manager created successfully',
      data: {
        id: newUserId,
        username: employee_id,
        name: employee.name_en,
        role,
        default_password: employee_id,
      },
    });
  } catch (error) {
    logger.error('Failed to create manager', error);
    next(error);
  }
});

/**
 * GET /api/admin/managers
 * Get all managers with department access
 */
router.get('/managers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kpiDb = await getKpiDb();

    const result = await kpiDb.request().query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.role,
        u.department_id,
        u.is_active,
        u.created_at,
        d.name_en as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.dept_id
      WHERE u.role IN ('manager', 'admin', 'superadmin', 'user')
      ORDER BY u.role, u.full_name
    `);

    // Get department access for each user
    const usersWithAccess = await Promise.all(
      result.recordset.map(async (u: any) => {
        const accessResult = await kpiDb.request().input('user_id', sql.Int, u.id).query(`
            SELECT 
              uda.department_id,
              uda.access_level,
              d.name_en as department_name
            FROM user_department_access uda
            LEFT JOIN departments d ON uda.department_id = d.dept_id
            WHERE uda.user_id = @user_id
          `);

        return {
          ...u,
          department_access: accessResult.recordset,
        };
      })
    );

    res.json({
      success: true,
      data: usersWithAccess,
    });
  } catch (error) {
    logger.error('Failed to get managers', error);
    next(error);
  }
});

/**
 * DELETE /api/admin/managers/:id
 * Remove manager role (set to user)
 */
router.delete('/managers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const kpiDb = await getKpiDb();

    // Remove department access
    await kpiDb
      .request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM user_department_access WHERE user_id = @id`);

    // Set role back to user
    await kpiDb
      .request()
      .input('id', sql.Int, id)
      .query(`UPDATE users SET role = 'user', updated_at = GETDATE() WHERE id = @id`);

    res.json({
      success: true,
      message: 'Manager role removed',
    });
  } catch (error) {
    logger.error('Failed to remove manager', error);
    next(error);
  }
});

export default router;
