import express from 'express';
import sql from 'mssql';
import { getKpiDb } from '../config/database';
import { logger } from '../utils/logger';

const router = express.Router();

// SPO Database configuration
const getSpoDbConfig = (): sql.config => ({
  server: process.env.DB_HOST!,
  database: process.env.DB_SPO_NAME || 'SPO_Dev',
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  port: parseInt(process.env.DB_PORT!),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
});

let spoPool: sql.ConnectionPool | null = null;

const getSpoDb = async (): Promise<sql.ConnectionPool> => {
  if (spoPool && spoPool.connected) {
    return spoPool;
  }

  try {
    spoPool = await new sql.ConnectionPool(getSpoDbConfig()).connect();
    logger.info('SPO database connected successfully');
    return spoPool;
  } catch (error) {
    logger.error('Failed to connect to SPO database', error);
    throw error;
  }
};

/**
 * GET /api/departments
 * Get all departments from SPO_Dev and sync with local departments table
 */
router.get('/', async (req, res) => {
  try {
    const kpiDb = await getKpiDb();

    // First, try to get from local departments table
    const localResult = await kpiDb.request().query(`
      SELECT id, dept_code, dept_id, name_en, name_th, [type], company, status, sort_order
      FROM departments
      WHERE status = 'Active'
      ORDER BY sort_order, name_en
    `);

    if (localResult.recordset.length > 0) {
      return res.json({
        success: true,
        data: localResult.recordset,
        source: 'local',
      });
    }

    // If no local data, fetch from SPO_Dev
    try {
      const spoDb = await getSpoDb();
      const spoResult = await spoDb.request().query(`
        SELECT 
          SKDCode as dept_code,
          DepartmentID as dept_id,
          DepartmentName as name_en,
          '' as name_th,
          Type as [type],
          Company as company,
          'Active' as status,
          ROW_NUMBER() OVER (ORDER BY DepartmentName) as sort_order
        FROM Department
        WHERE Status = 'Active'
        ORDER BY DepartmentName
      `);

      // Sync to local table
      for (const dept of spoResult.recordset) {
        await kpiDb
          .request()
          .input('dept_code', sql.NVarChar, dept.dept_code)
          .input('dept_id', sql.NVarChar, dept.dept_id)
          .input('name_en', sql.NVarChar, dept.name_en)
          .input('name_th', sql.NVarChar, dept.name_th)
          .input('type', sql.NVarChar, dept.type)
          .input('company', sql.NVarChar, dept.company)
          .input('status', sql.NVarChar, 'Active')
          .input('sort_order', sql.Int, dept.sort_order).query(`
            IF NOT EXISTS (SELECT 1 FROM departments WHERE dept_id = @dept_id)
            BEGIN
              INSERT INTO departments (dept_code, dept_id, name_en, name_th, [type], company, status, sort_order, created_at, updated_at)
              VALUES (@dept_code, @dept_id, @name_en, @name_th, @type, @company, @status, @sort_order, GETDATE(), GETDATE())
            END
          `);
      }

      // Return the synced data
      const syncedResult = await kpiDb.request().query(`
        SELECT id, dept_code, dept_id, name_en, name_th, [type], company, status, sort_order
        FROM departments
        WHERE status = 'Active'
        ORDER BY sort_order, name_en
      `);

      return res.json({
        success: true,
        data: syncedResult.recordset,
        source: 'spo_synced',
      });
    } catch (spoError) {
      logger.error('Failed to fetch from SPO database', spoError);
      // Return empty array if SPO connection fails
      return res.json({
        success: true,
        data: [],
        source: 'spo_failed',
      });
    }
  } catch (error) {
    logger.error('Error fetching departments', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch departments',
    });
  }
});

/**
 * GET /api/departments/with-metrics/:category
 * Get all departments that have metrics for a specific category, with their fill status
 */
router.get('/with-metrics/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const kpiDb = await getKpiDb();

    // Get departments with metrics for this category from category-specific tables
    const result = await kpiDb.request().input('category', sql.NVarChar, category).query(`
      SELECT 
        d.dept_id,
        d.name_en,
        1 as has_metrics,
        COUNT(DISTINCT m.id) as metric_count,
        COUNT(DISTINCT CASE WHEN de.id IS NOT NULL THEN m.id END) as filled_count
      FROM departments d
      INNER JOIN ${category}_metrics m ON m.department_id = d.dept_id
      LEFT JOIN ${category}_data_entries de ON de.metric_id = m.id
        AND de.year = YEAR(GETDATE())
      WHERE d.status = 'Active'
      GROUP BY d.dept_id, d.name_en
      ORDER BY d.name_en
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    logger.error('Error fetching departments with metrics', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch departments with metrics',
    });
  }
});

/**
 * GET /api/departments/:dept_id/categories
 * Get KPI categories available for a specific department
 */
router.get('/:dept_id/categories', async (req, res) => {
  try {
    const { dept_id } = req.params;
    const kpiDb = await getKpiDb();

    // Get categories that have metrics for this department
    const result = await kpiDb.request().input('dept_id', sql.NVarChar, dept_id).query(`
      SELECT DISTINCT
        kc.id, kc.name_en, kc.name_th, kc.[key], kc.color, kc.icon, kc.sort_order
      FROM kpi_categories kc
      INNER JOIN kpi_metrics km ON km.category_id = kc.id
      WHERE km.department_id = @dept_id OR km.department_id IS NULL
      ORDER BY kc.sort_order
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    logger.error('Error fetching department categories', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch department categories',
    });
  }
});

/**
 * GET /api/departments/:dept_id/sub-categories/:category
 * Get sub-categories for a specific department and category
 */
router.get('/:dept_id/sub-categories/:category', async (req, res) => {
  try {
    const { dept_id, category } = req.params;
    const kpiDb = await getKpiDb();

    // Get sub-categories with metrics for this department from category-specific tables
    const result = await kpiDb.request().input('dept_id', sql.NVarChar, dept_id).query(`
      SELECT DISTINCT
        sc.id, sc.name_en, sc.name_th, sc.[key], sc.sort_order
      FROM ${category}_sub_categories sc
      INNER JOIN ${category}_metrics m ON m.sub_category_id = sc.id
      WHERE m.department_id = @dept_id
      ORDER BY sc.sort_order
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    logger.error('Error fetching department sub-categories', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch department sub-categories',
    });
  }
});

/**
 * GET /api/departments/:dept_id/metrics/:category/:sub_category?
 * Get metrics for a specific department, category, and optionally sub-category
 */
router.get('/:dept_id/metrics/:category/:sub_category?', async (req, res) => {
  try {
    const { dept_id, category, sub_category } = req.params;
    const kpiDb = await getKpiDb();

    let query = `
      SELECT 
        m.id, m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate,
        m.description_of_target, m.sub_category_id, sc.name_en as sub_category_name,
        sc.[key] as sub_category_key, m.department_id, d.name_en as department_name
      FROM ${category}_metrics m
      INNER JOIN ${category}_sub_categories sc ON m.sub_category_id = sc.id
      LEFT JOIN departments d ON m.department_id = d.dept_id
      WHERE m.department_id = @dept_id
    `;

    if (sub_category) {
      query += ` AND sc.[key] = @sub_category`;
    }

    query += ` ORDER BY sc.sort_order, m.no`;

    const request = kpiDb.request().input('dept_id', sql.NVarChar, dept_id);

    if (sub_category) {
      request.input('sub_category', sql.NVarChar, sub_category);
    }

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    logger.error('Error fetching department metrics', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch department metrics',
    });
  }
});

export default router;
