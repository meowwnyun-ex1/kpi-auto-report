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
 * GET /api/admin/employees
 * Get all employees from CAS database, fallback to users table in KPI database
 */
router.get('/employees', async (req: Request, res: Response, next: NextFunction) => {
  try {
    try {
      const casDb = await getCasDb();
      const kpiDb = await getKpiDb();

      // Get existing usernames from KPI database to exclude
      const existingUsersResult = await kpiDb.request().query(`
        SELECT username FROM users WHERE role IN ('manager', 'admin', 'superadmin', 'user')
      `);
      const existingUsernames = existingUsersResult.recordset.map((u: any) => u.username);

      const request = casDb.request();
      let query = `
        SELECT 
          employee_id,
          name,
          name_en,
          email,
          is_head,
          department_code as department_id,
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
          section_name,
          company_name,
          division_name
        FROM employees
        WHERE is_active = 1
      `;

      if (existingUsernames.length > 0) {
        query += ` AND employee_id NOT IN (${existingUsernames.map((_, i) => `@username${i}`).join(',')})`;
        existingUsernames.forEach((username, i) => {
          request.input(`username${i}`, sql.NVarChar, username);
        });
      }

      query += ` ORDER BY department_name, name_en`;

      const result = await request.query(query);

      res.json({ success: true, data: result.recordset });
    } catch (dbError: unknown) {
      logger.warn(
        'CAS database not available, falling back to users table',
        dbError as Record<string, unknown>
      );

      // Fallback to users table in KPI database - only show associates without system accounts
      try {
        const kpiDb = await getKpiDb();
        const result = await kpiDb.request().query(`
          SELECT
            id as employee_id,
            full_name as name,
            full_name as name_en,
            email,
            0 as is_head,
            department_id,
            is_active,
            0 as position_level_id,
            NULL as position_id,
            NULL as first_name_en,
            NULL as last_name_en,
            NULL as first_name_th,
            NULL as last_name_th,
            NULL as name_title_en,
            NULL as name_title_th,
            department_name,
            NULL as section_name,
            NULL as company_name,
            NULL as division_name
          FROM users
          WHERE is_active = 1 AND (role IS NULL OR role = 'associate' OR role = '')
          ORDER BY department_name, full_name
        `);
        res.json({ success: true, data: result.recordset, source: 'users' });
      } catch (fallbackError) {
        logger.error('Fallback to users table also failed', fallbackError);
        res.json({ success: true, data: [], message: 'No employee data available' });
      }
    }
  } catch (error) {
    logger.error('Failed to get employees', error);
    next(error);
  }
});

/**
 * GET /api/admin/employees/search
 * Search employees from CAS database, fallback to users table in KPI database
 */
router.get('/employees/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, department_id, limit = 20 } = req.query;

    if (!q && !department_id) {
      return res.json({ success: true, data: [] });
    }

    try {
      const casDb = await getCasDb();
      const request = casDb.request();

      // Sanitize limit parameter
      const safeLimit = Math.min(Math.max(1, parseInt(limit as string) || 20), 100);
      request.input('limit', sql.Int, safeLimit);

      let query = `
        SELECT TOP(@limit)
          employee_id,
          name,
          name_en,
          email,
          is_head,
          department_code as department_id,
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
          section_name,
          company_name,
          division_name
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
        query += ` AND department_code = @department_id`;
      }

      query += ` ORDER BY name_en`;

      const result = await request.query(query);

      res.json({
        success: true,
        data: result.recordset,
      });
    } catch (dbError: unknown) {
      logger.warn(
        'CAS database not available for search, falling back to users table',
        dbError as Record<string, unknown>
      );

      // Fallback to users table in KPI database
      try {
        const kpiDb = await getKpiDb();
        const request = kpiDb.request();

        // Sanitize limit parameter
        const safeLimit = Math.min(Math.max(1, parseInt(limit as string) || 20), 100);
        request.input('limit', sql.Int, safeLimit);

        let query = `
          SELECT TOP(@limit)
            id as employee_id,
            full_name as name,
            full_name as name_en,
            email,
            0 as is_head,
            department_id,
            is_active,
            0 as position_level_id,
            NULL as position_id,
            NULL as first_name_en,
            NULL as last_name_en,
            NULL as first_name_th,
            NULL as last_name_th,
            NULL as name_title_en,
            NULL as name_title_th,
            department_name,
            NULL as section_name
          FROM users
          WHERE is_active = 1
        `;

        if (q) {
          request.input('search', sql.NVarChar, `%${q}%`);
          query += `
            AND (
              CAST(id AS NVARCHAR) LIKE @search
              OR full_name LIKE @search
              OR email LIKE @search
            )
          `;
        }

        if (department_id) {
          request.input('department_id', sql.NVarChar, department_id);
          query += ` AND department_id = @department_id`;
        }

        query += ` ORDER BY full_name`;

        const result = await request.query(query);
        res.json({ success: true, data: result.recordset, source: 'users' });
      } catch (fallbackError) {
        logger.error('Fallback to users table also failed', fallbackError);
        res.json({ success: true, data: [], message: 'No employee data available' });
      }
    }
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
    // Try SPO_Dev first, fallback to kpi_department_mapping
    let departments: any[] = [];
    try {
      const spoDb = await getSpoDb();
      const result = await spoDb.request().query(`
        SELECT 
          ID as dept_id,
          Section_name as name_en,
          Company as company,
          is_active as status
        FROM dept_master
        WHERE is_active = 'Active'
        ORDER BY Section_name
      `);
      departments = result.recordset;
    } catch (spoError: unknown) {
      logger.warn(
        'SPO_Dev database unavailable for /spo-departments, using KPI mapping',
        spoError as Record<string, unknown>
      );
      const kpiDb = await getKpiDb();
      const mappingResult = await kpiDb.request().query(`
        SELECT kpi_code as dept_id, description as name_en FROM kpi_department_mapping ORDER BY kpi_code
      `);
      departments = mappingResult.recordset.map((d: any) => ({
        dept_id: d.dept_id,
        name_en: d.name_en,
        company: null,
        status: 'Active',
      }));
    }

    res.json({
      success: true,
      data: departments,
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
    let casDb: sql.ConnectionPool;
    try {
      casDb = await getCasDb();
    } catch (casError: unknown) {
      logger.warn(
        'CAS database unavailable for /managers, falling back to KPI mapping',
        casError as Record<string, unknown>
      );
      return res.status(500).json({
        success: false,
        message: 'CAS database unavailable. Please contact administrator.',
      });
    }

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
        u.created_at
      FROM users u
      WHERE u.role IN ('manager', 'admin', 'superadmin', 'user')
      ORDER BY u.role, u.full_name
    `);

    // Get department names from kpi_department_mapping (primary source)
    const kpiDeptResult = await kpiDb.request().query(`
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
      logger.warn(
        'SPO_Dev database unavailable for /managers',
        spoError as Record<string, unknown>
      );
    }

    // Get department access for each user
    const usersWithAccess = await Promise.all(
      result.recordset.map(async (u: any) => {
        const accessResult = await kpiDb.request().input('user_id', sql.NVarChar, String(u.id))
          .query(`
            SELECT 
              uda.department_id,
              uda.access_level
            FROM user_department_access uda
            WHERE uda.user_id = @user_id
          `);

        // Add department names from SPO_Dev
        const accessWithNames = accessResult.recordset.map((a: any) => ({
          ...a,
          department_name: deptMap.get(a.department_id) || a.department_id,
        }));

        return {
          ...u,
          department_name: deptMap.get(u.department_id) || u.department_id,
          department_access: accessWithNames,
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

// ============================================
// KPI ITEMS MANAGEMENT
// ============================================

const CATEGORIES = [
  'safety',
  'quality',
  'delivery',
  'compliance',
  'hr',
  'attractive',
  'environment',
  'cost',
];

/**
 * GET /api/admin/kpi-items
 * Get all KPI items across all categories
 * Admin/SuperAdmin sees all, Manager sees only their department items
 */
router.get('/kpi-items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kpiDb = await getKpiDb();
    const { category, department_id } = req.query;
    const userRole = req.user!.role;
    const userDept = (req.user as any).department_id;

    // Determine department filter based on role
    const isAdminUser = userRole === 'admin' || userRole === 'superadmin';
    const filterDept = isAdminUser ? (department_id as string) || null : userDept;

    // Get department names from kpi_department_mapping (primary source)
    const kpiDeptResult = await kpiDb.request().query(`
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
        'SPO_Dev database unavailable for /kpi-items',
        spoError as Record<string, unknown>
      );
    }

    const allItems: any[] = [];

    // Get items from kpi_yearly_targets (unified table)
    for (const cat of CATEGORIES) {
      if (category && category !== cat) continue;

      // Get category info
      const catResult = await kpiDb
        .request()
        .input('catKey', sql.NVarChar, cat)
        .query(`SELECT id, name FROM kpi_categories WHERE [key] = @catKey`);

      if (catResult.recordset.length === 0) continue;

      const categoryId = catResult.recordset[0]?.id;
      const categoryName = catResult.recordset[0]?.name || cat;

      // Build query with department filter
      let query = `
        SELECT 
          yt.id,
          mm.measurement,
          mm.unit,
          mm.main,
          mm.main_relate,
          mm.description_of_target,
          yt.fy_target as fy25_target,
          sc.id as sub_category_id,
          yt.sort_order,
          yt.created_at,
          yt.updated_at,
          sc.name as sub_category_name,
          @categoryId as category_id,
          @categoryName as category_name,
          @catKey as category_key
        FROM kpi_yearly_targets yt
        LEFT JOIN kpi_measurements mm ON yt.measurement_id = mm.id
        LEFT JOIN kpi_measurement_sub_categories sc ON mm.sub_category_id = sc.id
      `;

      const request = kpiDb
        .request()
        .input('categoryId', sql.Int, categoryId)
        .input('categoryName', sql.NVarChar, categoryName)
        .input('catKey', sql.NVarChar, cat);

      if (filterDept) {
        query += ` WHERE mm.main = @filterDept OR mm.main_relate LIKE '%' + @filterDept + '%'`;
        request.input('filterDept', sql.NVarChar, filterDept);
      }

      query += ` ORDER BY yt.sort_order, mm.id`;

      const result = await request.query(query);

      // Add department names from SPO_Dev
      const itemsWithDeptName = result.recordset.map((item: any) => ({
        ...item,
        department_name: deptMap.get(item.main) || item.main,
      }));

      allItems.push(...itemsWithDeptName);
    }

    res.json({ success: true, data: allItems });
  } catch (error) {
    logger.error('Failed to get KPI items', error);
    next(error);
  }
});

/**
 * GET /api/admin/kpi-subcategories/:category
 * Get sub-categories for a specific category
 */
router.get(
  '/kpi-subcategories/:category',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category } = req.params;
      const kpiDb = await getKpiDb();

      // Check if table exists
      const tableCheck = await kpiDb
        .request()
        .input('tableName', sql.NVarChar, `${category}_sub_categories`).query(`
          SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = @tableName
        `);

      if (tableCheck.recordset[0].count === 0) {
        return res.json({ success: true, data: [] });
      }

      // Sub-categories are no longer used in the new schema
      const result = await kpiDb.request().query(`
        SELECT TOP 0 id, name_en, name_th, [key], sort_order
        FROM kpi_measurement_sub_categories
        WHERE 1 = 0
      `);

      res.json({ success: true, data: result.recordset });
    } catch (error) {
      logger.error('Failed to get sub-categories', error);
      next(error);
    }
  }
);

/**
 * POST /api/admin/kpi-subcategories/:category
 * Create a new sub-category for a category
 */
router.post(
  '/kpi-subcategories/:category',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category } = req.params;
      const { name_en, name_th, sort_order = 0 } = req.body;
      const kpiDb = await getKpiDb();

      if (!name_en) {
        return res.status(400).json({
          success: false,
          message: 'Sub-category name is required',
        });
      }

      // Sub-categories are no longer supported in the new schema
      return res.status(400).json({
        success: false,
        message: 'Sub-categories are no longer supported. Use kpi_yearly_targets directly.',
      });
    } catch (error) {
      logger.error('Failed to create sub-category', error);
      next(error);
    }
  }
);

/**
 * POST /api/admin/kpi-items
 * Create a new KPI item
 */
router.post('/kpi-items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      category_key,
      sub_category_id,
      no,
      measurement,
      unit,
      main,
      main_relate,
      description_of_target,
      fy25_target,
      sort_order = 0,
    } = req.body;

    if (!category_key || !measurement) {
      return res.status(400).json({
        success: false,
        message: 'Category and measurement are required',
      });
    }

    const kpiDb = await getKpiDb();

    // Legacy table-based KPI items are no longer supported
    // Use kpi-yearly routes to create yearly targets instead
    return res.status(400).json({
      success: false,
      message:
        'Legacy KPI items are no longer supported. Use /api/kpi-forms/yearly routes instead.',
    });

    // This code is unreachable due to early return above
  } catch (error) {
    logger.error('Failed to create KPI item', error);
    next(error);
  }
});

/**
 * PUT /api/admin/kpi-items/:category_key/:id
 * Update a KPI item
 */
router.put(
  '/kpi-items/:category_key/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category_key, id } = req.params;
      const {
        sub_category_id,
        no,
        measurement,
        unit,
        main,
        main_relate,
        description_of_target,
        fy25_target,
        sort_order,
      } = req.body;

      const kpiDb = await getKpiDb();

      // Legacy table-based KPI items are no longer supported
      return res.status(400).json({
        success: false,
        message:
          'Legacy KPI items are no longer supported. Use /api/kpi-forms/yearly routes instead.',
      });
    } catch (error) {
      logger.error('Failed to update KPI item', error);
      next(error);
    }
  }
);

/**
 * DELETE /api/admin/kpi-items/:category_key/:id
 * Delete a KPI item
 */
router.delete(
  '/kpi-items/:category_key/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category_key, id } = req.params;
      const kpiDb = await getKpiDb();

      // Legacy table-based KPI items are no longer supported
      return res.status(400).json({
        success: false,
        message:
          'Legacy KPI items are no longer supported. Use /api/kpi-forms/yearly routes instead.',
      });
    } catch (error) {
      logger.error('Failed to delete KPI item', error);
      next(error);
    }
  }
);

/**
 * GET /api/admin/kpi-templates
 * Get KPI templates (for backward compatibility with existing AdminPage)
 */
router.get('/kpi-templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kpiDb = await getKpiDb();
    const allTemplates: any[] = [];

    // Get items from kpi_yearly_targets (unified table)
    for (const cat of CATEGORIES) {
      // Get category info
      const catResult = await kpiDb
        .request()
        .input('catKey', sql.NVarChar, cat)
        .query(`SELECT id, name FROM kpi_categories WHERE [key] = @catKey`);

      const categoryId = catResult.recordset[0]?.id;
      const categoryName = catResult.recordset[0]?.name || cat;

      const result = await kpiDb.request().input('categoryId', sql.Int, categoryId).query(`
          SELECT 
            yt.id,
            mm.measurement as metric_name,
            mm.unit,
            yt.is_active
          FROM kpi_yearly_targets yt
          LEFT JOIN kpi_measurements mm ON yt.measurement_id = mm.id
          WHERE yt.category_id = @categoryId
          ORDER BY yt.sort_order, mm.id
        `);

      for (const row of result.recordset) {
        allTemplates.push({
          ...row,
          category_id: categoryId,
          category_name: categoryName,
          is_active: true,
        });
      }
    }

    res.json({ success: true, data: allTemplates });
  } catch (error) {
    logger.error('Failed to get KPI templates', error);
    next(error);
  }
});

/**
 * @route GET /api/admin/stats
 * @desc Get admin dashboard statistics
 * @access Private (admin/superadmin only)
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getKpiDb();

    // Get year from query param or use current fiscal year
    const queryYear = req.query.year ? parseInt(req.query.year as string) : null;

    // Get current fiscal year (Thai fiscal year starts April)
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentFiscalYear = currentMonth >= 4 ? now.getFullYear() : now.getFullYear() - 1;

    const fiscalYear = queryYear || currentFiscalYear;

    // Get comprehensive admin statistics
    const statsResult = await db.request().input('fiscalYear', sql.Int, fiscalYear).query(`
      SELECT 
        -- User statistics
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as totalUsers,
        (SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = 1) as adminUsers,
        (SELECT COUNT(*) FROM users WHERE role = 'manager' AND is_active = 1) as managerUsers,
        (SELECT COUNT(*) FROM users WHERE role = 'user' AND is_active = 1) as regularUsers,
        
        -- KPI statistics for the fiscal year
        (SELECT COUNT(*) FROM kpi_yearly_targets WHERE fiscal_year = @fiscalYear) as totalTargets,
        (SELECT COUNT(*) FROM kpi_yearly_targets WHERE fiscal_year = @fiscalYear AND fy_target IS NOT NULL) as targetsSet,
        (SELECT COUNT(*) FROM kpi_monthly_targets WHERE fiscal_year = @fiscalYear) as monthlyEntries,
        (SELECT COUNT(*) FROM kpi_monthly_targets WHERE fiscal_year = @fiscalYear AND result IS NOT NULL) as resultsEntered,
        (SELECT COUNT(*) FROM kpi_monthly_targets WHERE fiscal_year = @fiscalYear AND result IS NOT NULL AND result >= target) as achievedTargets,
        
        -- Department statistics
        (SELECT COUNT(*) FROM kpi_department_mapping) as totalDepartments,
        (SELECT COUNT(DISTINCT main) FROM kpi_yearly_targets WHERE fiscal_year = @fiscalYear) as activeDepartments,
        
        -- Category statistics
        (SELECT COUNT(*) FROM kpi_categories WHERE is_active = 1) as totalCategories,
        
        -- Action plans
        (SELECT COUNT(*) FROM kpi_action_plans WHERE fiscal_year = @fiscalYear) as actionPlans,
        
        -- Recent activity
        (SELECT COUNT(*) FROM users WHERE last_login >= DATEADD(day, -7, GETDATE())) as activeUsersLast7Days,
        (SELECT COUNT(*) FROM kpi_monthly_targets WHERE updated_at >= DATEADD(day, -7, GETDATE())) as updatedLast7Days
    `);

    const stats = statsResult.recordset[0];

    // Get available fiscal years
    const yearsResult = await db.request().query(`
      SELECT DISTINCT fiscal_year 
      FROM kpi_yearly_targets 
      WHERE fiscal_year IS NOT NULL 
      ORDER BY fiscal_year DESC
    `);
    const availableYears = yearsResult.recordset.map((r: any) => r.fiscal_year);

    res.json({
      success: true,
      data: {
        fiscalYear,
        availableYears,
        users: {
          total: stats.totalUsers || 0,
          admins: stats.adminUsers || 0,
          managers: stats.managerUsers || 0,
          regular: stats.regularUsers || 0,
          activeLast7Days: stats.activeUsersLast7Days || 0,
        },
        kpis: {
          totalTargets: stats.totalTargets || 0,
          targetsSet: stats.targetsSet || 0,
          monthlyEntries: stats.monthlyEntries || 0,
          resultsEntered: stats.resultsEntered || 0,
          achievedTargets: stats.achievedTargets || 0,
          updatedLast7Days: stats.updatedLast7Days || 0,
        },
        departments: {
          total: stats.totalDepartments || 0,
          active: stats.activeDepartments || 0,
        },
        categories: stats.totalCategories || 0,
        actionPlans: stats.actionPlans || 0,
      },
    });
  } catch (error) {
    logger.error('Failed to get admin stats', error);
    next(error);
  }
});

export default router;
