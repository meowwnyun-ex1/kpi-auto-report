import express from 'express';
import { getKpiDb } from '../config/database';
import sql from 'mssql';

const router = express.Router();

// ============================================
// ENVIRONMENT KPI ROUTES
// ============================================

/**
 * GET /api/environment/summary
 * Get overall summary of Environment KPIs
 */
router.get('/summary', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { year = new Date().getFullYear() } = req.query;

    const result = await pool.request().input('year', sql.Int, Number(year)).query(`
        SELECT 
          COUNT(DISTINCT m.id) as total_metrics,
          COUNT(DISTINCT sc.id) as total_sub_categories,
          COUNT(DISTINCT de.id) as total_entries,
          COUNT(CASE WHEN de.result IS NOT NULL AND de.result != '' THEN 1 END) as completed_entries
        FROM environment_metrics m
        LEFT JOIN environment_sub_categories sc ON m.sub_category_id = sc.id
        LEFT JOIN environment_data_entries de ON de.metric_id = m.id AND de.year = @year
      `);

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Error fetching environment summary:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment summary',
    });
  }
});

/**
 * GET /api/environment/sub-categories
 * Get all sub-categories for Environment KPIs
 */
router.get('/sub-categories', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const result = await pool.request().query(`
        SELECT id, name_en, name_th, [key], sort_order, created_at, updated_at
        FROM environment_sub_categories
        ORDER BY sort_order
      `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error fetching environment sub-categories:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment sub-categories',
    });
  }
});

/**
 * GET /api/environment/metrics
 * Get all metrics for Environment KPIs
 */
router.get('/metrics', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { sub_category } = req.query;

    let query = `
      SELECT 
        m.id, m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate,
        m.description_of_target, m.sub_category_id, sc.name_en as sub_category_name,
        sc.[key] as sub_category_key
      FROM environment_metrics m
      INNER JOIN environment_sub_categories sc ON m.sub_category_id = sc.id
    `;

    if (sub_category) {
      query += ` WHERE sc.[key] = @sub_category`;
    }

    query += ` ORDER BY sc.sort_order, m.no`;

    const request = pool.request();
    if (sub_category) {
      request.input('sub_category', sql.NVarChar, sub_category);
    }

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error fetching environment metrics:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment metrics',
    });
  }
});

/**
 * GET /api/environment/entries
 * Get data entries for Environment KPIs
 */
router.get('/entries', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { year = new Date().getFullYear(), month, sub_category } = req.query;

    let query = `
      SELECT 
        de.id, de.metric_id, de.month, de.year, de.target, de.result,
        de.accu_target, de.accu_result, de.forecast, de.reason,
        de.recover_activity, de.forecast_result_total, de.recovery_month,
        m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key
      FROM environment_data_entries de
      INNER JOIN environment_metrics m ON de.metric_id = m.id
      INNER JOIN environment_sub_categories sc ON m.sub_category_id = sc.id
      WHERE de.year = @year
    `;

    const request = pool.request().input('year', sql.Int, Number(year));

    if (month) {
      query += ` AND de.month = @month`;
      request.input('month', sql.NVarChar, month);
    }

    if (sub_category) {
      query += ` AND sc.[key] = @sub_category`;
      request.input('sub_category', sql.NVarChar, sub_category);
    }

    query += ` ORDER BY sc.sort_order, m.no, de.month`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error fetching environment entries:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment entries',
    });
  }
});

/**
 * GET /api/environment/trend
 * Get trend data for a specific metric
 */
router.get('/trend/:metricId', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { metricId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const result = await pool
      .request()
      .input('metricId', sql.Int, Number(metricId))
      .input('year', sql.Int, Number(year)).query(`
        SELECT 
          de.id, de.month, de.year, de.target, de.result,
          de.accu_target, de.accu_result, de.forecast,
          m.no, m.measurement, m.unit, m.fy25_target
        FROM environment_data_entries de
        INNER JOIN environment_metrics m ON de.metric_id = m.id
        WHERE de.metric_id = @metricId AND de.year = @year
        ORDER BY 
          CASE de.month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END
      `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error fetching environment trend:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment trend',
    });
  }
});

/**
 * GET /api/environment/by-month
 * Get all metrics data for a specific month
 */
router.get('/by-month/:month', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { month } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const result = await pool
      .request()
      .input('month', sql.NVarChar, month)
      .input('year', sql.Int, Number(year)).query(`
        SELECT 
          de.id, de.metric_id, de.target, de.result,
          de.accu_target, de.accu_result, de.forecast, de.reason,
          de.recover_activity, de.forecast_result_total, de.recovery_month,
          m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
          sc.name_en as sub_category_name, sc.[key] as sub_category_key
        FROM environment_data_entries de
        INNER JOIN environment_metrics m ON de.metric_id = m.id
        INNER JOIN environment_sub_categories sc ON m.sub_category_id = sc.id
        WHERE de.month = @month AND de.year = @year
        ORDER BY sc.sort_order, m.no
      `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error fetching environment by month:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment by month',
    });
  }
});

/**
 * GET /api/environment/years
 * Get available years for Environment KPI data
 */
router.get('/years', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const result = await pool.request().query(`
        SELECT DISTINCT year 
        FROM environment_data_entries
        ORDER BY year DESC
      `);

    res.json({
      success: true,
      data: result.recordset.map((r) => r.year),
    });
  } catch (error) {
    console.error('Error fetching available years:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch available years',
    });
  }
});

/**
 * PUT /api/environment/update
 * Update a data entry
 */
router.put('/update', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const {
      id,
      target,
      result,
      accu_target,
      accu_result,
      forecast,
      reason,
      recover_activity,
      forecast_result_total,
      recovery_month,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Entry ID is required',
      });
    }

    const result_db = await pool
      .request()
      .input('id', sql.Int, id)
      .input('target', sql.NVarChar, target || null)
      .input('result', sql.NVarChar, result || null)
      .input('accu_target', sql.NVarChar, accu_target || null)
      .input('accu_result', sql.NVarChar, accu_result || null)
      .input('forecast', sql.NVarChar, forecast || null)
      .input('reason', sql.NVarChar, reason || null)
      .input('recover_activity', sql.NVarChar, recover_activity || null)
      .input('forecast_result_total', sql.NVarChar, forecast_result_total || null)
      .input('recovery_month', sql.NVarChar, recovery_month || null).query(`
        UPDATE environment_data_entries
        SET 
          target = @target,
          result = @result,
          accu_target = @accu_target,
          accu_result = @accu_result,
          forecast = @forecast,
          reason = @reason,
          recover_activity = @recover_activity,
          forecast_result_total = @forecast_result_total,
          recovery_month = @recovery_month,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    if (result_db.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Entry not found',
      });
    }

    res.json({
      success: true,
      message: 'Entry updated successfully',
    });
  } catch (error) {
    console.error('Error updating environment entry:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to update environment entry',
    });
  }
});

/**
 * GET /api/environment/dashboard
 * Get dashboard overview for Environment KPIs
 */
router.get('/dashboard', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { year = new Date().getFullYear() } = req.query;

    // Get summary by sub-category
    const summaryResult = await pool.request().input('year', sql.Int, Number(year)).query(`
        SELECT 
          sc.id as sub_category_id,
          sc.name_en as sub_category_name,
          sc.[key] as sub_category_key,
          COUNT(m.id) as total_metrics,
          COUNT(de.id) as total_entries,
          COUNT(CASE WHEN de.result IS NOT NULL AND de.result != '' THEN 1 END) as completed_entries
        FROM environment_sub_categories sc
        LEFT JOIN environment_metrics m ON m.sub_category_id = sc.id
        LEFT JOIN environment_data_entries de ON de.metric_id = m.id AND de.year = @year
        GROUP BY sc.id, sc.name_en, sc.[key]
        ORDER BY sc.sort_order
      `);

    // Get latest month data
    const latestMonthResult = await pool.request().input('year', sql.Int, Number(year)).query(`
        SELECT TOP 1 de.month, de.year
        FROM environment_data_entries de
        WHERE de.year = @year AND de.result IS NOT NULL AND de.result != ''
        ORDER BY 
          CASE de.month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END DESC
      `);

    res.json({
      success: true,
      data: {
        summary_by_sub_category: summaryResult.recordset,
        latest_month: latestMonthResult.recordset[0] || null,
      },
    });
  } catch (error) {
    console.error('Error fetching environment dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment dashboard',
    });
  }
});

// ============================================
// ENVIRONMENT BY DEPARTMENT KPI ROUTES
// ============================================

/**
 * GET /api/environment/dept/summary
 * Get overall summary of Environment by Department KPIs
 */
router.get('/dept/summary', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { year = new Date().getFullYear() } = req.query;

    const result = await pool.request().input('year', sql.Int, Number(year)).query(`
        SELECT 
          COUNT(DISTINCT m.id) as total_metrics,
          COUNT(DISTINCT sc.id) as total_sub_categories,
          COUNT(DISTINCT d.id) as total_departments,
          COUNT(DISTINCT de.id) as total_entries
        FROM environment_dept_metrics m
        LEFT JOIN environment_dept_sub_categories sc ON m.sub_category_id = sc.id
        LEFT JOIN departments d ON m.department_id = d.id
        LEFT JOIN environment_dept_data_entries de ON de.metric_id = m.id AND de.year = @year
      `);

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Error fetching environment by dept summary:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment by dept summary',
    });
  }
});

/**
 * GET /api/environment/dept/departments
 * Get all departments
 */
router.get('/dept/departments', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const result = await pool.request().query(`
        SELECT id, name_en, name_th, [key], sort_order, created_at, updated_at
        FROM departments
        ORDER BY sort_order
      `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch departments',
    });
  }
});

/**
 * GET /api/environment/dept/sub-categories
 * Get all sub-categories for Environment by Department KPIs
 */
router.get('/dept/sub-categories', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const result = await pool.request().query(`
        SELECT id, name_en, name_th, [key], sort_order, created_at, updated_at
        FROM environment_dept_sub_categories
        ORDER BY sort_order
      `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error fetching environment dept sub-categories:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment dept sub-categories',
    });
  }
});

/**
 * GET /api/environment/dept/metrics
 * Get all metrics for Environment by Department KPIs
 */
router.get('/dept/metrics', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { sub_category, department } = req.query;

    let query = `
      SELECT 
        m.id, m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate,
        m.description_of_target, m.sub_category_id, m.department_id,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key,
        d.name_en as department_name, d.[key] as department_key
      FROM environment_dept_metrics m
      INNER JOIN environment_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
    `;

    const conditions: string[] = [];
    const request = pool.request();

    if (sub_category) {
      conditions.push('sc.[key] = @sub_category');
      request.input('sub_category', sql.NVarChar, sub_category);
    }

    if (department) {
      conditions.push('d.[key] = @department');
      request.input('department', sql.NVarChar, department);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY d.sort_order, sc.sort_order, m.no`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error fetching environment dept metrics:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment dept metrics',
    });
  }
});

/**
 * GET /api/environment/dept/entries
 * Get data entries for Environment by Department KPIs
 */
router.get('/dept/entries', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { year = new Date().getFullYear(), month, sub_category, department } = req.query;

    let query = `
      SELECT 
        de.id, de.metric_id, de.month, de.year, de.result,
        m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key,
        d.name_en as department_name, d.[key] as department_key
      FROM environment_dept_data_entries de
      INNER JOIN environment_dept_metrics m ON de.metric_id = m.id
      INNER JOIN environment_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
      WHERE de.year = @year
    `;

    const request = pool.request().input('year', sql.Int, Number(year));

    if (month) {
      query += ` AND de.month = @month`;
      request.input('month', sql.NVarChar, month);
    }

    if (sub_category) {
      query += ` AND sc.[key] = @sub_category`;
      request.input('sub_category', sql.NVarChar, sub_category);
    }

    if (department) {
      query += ` AND d.[key] = @department`;
      request.input('department', sql.NVarChar, department);
    }

    query += ` ORDER BY d.sort_order, sc.sort_order, m.no, de.month`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error fetching environment dept entries:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment dept entries',
    });
  }
});

/**
 * GET /api/environment/dept/by-department/:departmentKey
 * Get all metrics data for a specific department
 */
router.get('/dept/by-department/:departmentKey', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { departmentKey } = req.params;
    const { year = new Date().getFullYear(), month } = req.query;

    let query = `
      SELECT 
        de.id, de.metric_id, de.month, de.year, de.result,
        m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key,
        d.name_en as department_name, d.[key] as department_key
      FROM environment_dept_data_entries de
      INNER JOIN environment_dept_metrics m ON de.metric_id = m.id
      INNER JOIN environment_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
      WHERE d.[key] = @departmentKey AND de.year = @year
    `;

    const request = pool
      .request()
      .input('departmentKey', sql.NVarChar, departmentKey)
      .input('year', sql.Int, Number(year));

    if (month) {
      query += ` AND de.month = @month`;
      request.input('month', sql.NVarChar, month);
    }

    query += ` ORDER BY sc.sort_order, m.no`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error fetching environment by department:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment by department',
    });
  }
});

/**
 * GET /api/environment/dept/by-month/:month
 * Get all metrics data for a specific month
 */
router.get('/dept/by-month/:month', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { month } = req.params;
    const { year = new Date().getFullYear(), department } = req.query;

    let query = `
      SELECT 
        de.id, de.metric_id, de.result,
        m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key,
        d.name_en as department_name, d.[key] as department_key
      FROM environment_dept_data_entries de
      INNER JOIN environment_dept_metrics m ON de.metric_id = m.id
      INNER JOIN environment_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
      WHERE de.month = @month AND de.year = @year
    `;

    const request = pool
      .request()
      .input('month', sql.NVarChar, month)
      .input('year', sql.Int, Number(year));

    if (department) {
      query += ` AND d.[key] = @department`;
      request.input('department', sql.NVarChar, department);
    }

    query += ` ORDER BY d.sort_order, sc.sort_order, m.no`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error fetching environment dept by month:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment dept by month',
    });
  }
});

/**
 * GET /api/environment/dept/compare
 * Compare departments for a specific metric
 */
router.get('/dept/compare', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { year = new Date().getFullYear(), month, sub_category } = req.query;

    let query = `
      SELECT 
        d.id as department_id,
        d.name_en as department_name,
        d.[key] as department_key,
        SUM(CASE WHEN de.result IS NOT NULL AND de.result != '' 
          THEN TRY_CAST(de.result AS FLOAT) ELSE 0 END) as total_result
      FROM departments d
      LEFT JOIN environment_dept_metrics m ON m.department_id = d.id
      LEFT JOIN environment_dept_sub_categories sc ON m.sub_category_id = sc.id
      LEFT JOIN environment_dept_data_entries de ON de.metric_id = m.id AND de.year = @year
    `;

    const request = pool.request().input('year', sql.Int, Number(year));

    const conditions: string[] = [];

    if (month) {
      conditions.push('de.month = @month');
      request.input('month', sql.NVarChar, month);
    }

    if (sub_category) {
      conditions.push('sc.[key] = @sub_category');
      request.input('sub_category', sql.NVarChar, sub_category);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY d.id, d.name_en, d.[key], d.sort_order
      ORDER BY d.sort_order
    `;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error comparing departments:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to compare departments',
    });
  }
});

/**
 * GET /api/environment/dept/years
 * Get available years for Environment by Department KPI data
 */
router.get('/dept/years', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const result = await pool.request().query(`
        SELECT DISTINCT year 
        FROM environment_dept_data_entries
        ORDER BY year DESC
      `);

    res.json({
      success: true,
      data: result.recordset.map((r) => r.year),
    });
  } catch (error) {
    console.error('Error fetching available years:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch available years',
    });
  }
});

/**
 * PUT /api/environment/dept/update
 * Update a data entry
 */
router.put('/dept/update', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { id, result } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Entry ID is required',
      });
    }

    const result_db = await pool
      .request()
      .input('id', sql.Int, id)
      .input('result', sql.NVarChar, result || null).query(`
        UPDATE environment_dept_data_entries
        SET 
          result = @result,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    if (result_db.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Entry not found',
      });
    }

    res.json({
      success: true,
      message: 'Entry updated successfully',
    });
  } catch (error) {
    console.error('Error updating environment dept entry:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to update environment dept entry',
    });
  }
});

/**
 * GET /api/environment/dept/dashboard
 * Get dashboard overview for Environment by Department KPIs
 */
router.get('/dept/dashboard', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { year = new Date().getFullYear() } = req.query;

    // Get summary by department
    const summaryResult = await pool.request().input('year', sql.Int, Number(year)).query(`
        SELECT 
          d.id as department_id,
          d.name_en as department_name,
          d.[key] as department_key,
          COUNT(m.id) as total_metrics,
          COUNT(de.id) as total_entries,
          COUNT(CASE WHEN de.result IS NOT NULL AND de.result != '' THEN 1 END) as completed_entries
        FROM departments d
        LEFT JOIN environment_dept_metrics m ON m.department_id = d.id
        LEFT JOIN environment_dept_data_entries de ON de.metric_id = m.id AND de.year = @year
        GROUP BY d.id, d.name_en, d.[key], d.sort_order
        ORDER BY d.sort_order
      `);

    // Get latest month data
    const latestMonthResult = await pool.request().input('year', sql.Int, Number(year)).query(`
        SELECT TOP 1 de.month, de.year
        FROM environment_dept_data_entries de
        WHERE de.year = @year AND de.result IS NOT NULL AND de.result != ''
        ORDER BY 
          CASE de.month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END DESC
      `);

    res.json({
      success: true,
      data: {
        summary_by_department: summaryResult.recordset,
        latest_month: latestMonthResult.recordset[0] || null,
      },
    });
  } catch (error) {
    console.error('Error fetching environment dept dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch environment dept dashboard',
    });
  }
});

export default router;
