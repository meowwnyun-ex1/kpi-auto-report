import express from 'express';
import { getKpiDb } from '../config/database';
import sql from 'mssql';

const router = express.Router();

// ============================================
// COST KPI ROUTES
// ============================================

/**
 * GET /api/cost/summary
 * Get overall summary of Cost KPIs
 */
router.get('/summary', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { year = new Date().getFullYear() } = req.query;

    const result = await pool.request()
      .input('year', sql.Int, Number(year))
      .query(`
        SELECT 
          COUNT(DISTINCT m.id) as total_metrics,
          COUNT(DISTINCT sc.id) as total_sub_categories,
          COUNT(DISTINCT de.id) as total_entries,
          COUNT(CASE WHEN de.result IS NOT NULL AND de.result != '' THEN 1 END) as completed_entries
        FROM cost_metrics m
        LEFT JOIN cost_sub_categories sc ON m.sub_category_id = sc.id
        LEFT JOIN cost_data_entries de ON de.metric_id = m.id AND de.year = @year
      `);

    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching cost summary:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch cost summary'
    });
  }
});

/**
 * GET /api/cost/sub-categories
 * Get all sub-categories for Cost KPIs
 */
router.get('/sub-categories', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const result = await pool.request()
      .query(`
        SELECT id, name_en, name_th, [key], sort_order, created_at, updated_at
        FROM cost_sub_categories
        ORDER BY sort_order
      `);

    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching cost sub-categories:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch cost sub-categories'
    });
  }
});

/**
 * GET /api/cost/metrics
 * Get all metrics for Cost KPIs
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
      FROM cost_metrics m
      INNER JOIN cost_sub_categories sc ON m.sub_category_id = sc.id
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
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching cost metrics:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch cost metrics'
    });
  }
});

/**
 * GET /api/cost/entries
 * Get data entries for Cost KPIs
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
      FROM cost_data_entries de
      INNER JOIN cost_metrics m ON de.metric_id = m.id
      INNER JOIN cost_sub_categories sc ON m.sub_category_id = sc.id
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
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching cost entries:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch cost entries'
    });
  }
});

/**
 * GET /api/cost/trend
 * Get trend data for a specific metric
 */
router.get('/trend/:metricId', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { metricId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const result = await pool.request()
      .input('metricId', sql.Int, Number(metricId))
      .input('year', sql.Int, Number(year))
      .query(`
        SELECT 
          de.id, de.month, de.year, de.target, de.result,
          de.accu_target, de.accu_result, de.forecast,
          m.no, m.measurement, m.unit, m.fy25_target
        FROM cost_data_entries de
        INNER JOIN cost_metrics m ON de.metric_id = m.id
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
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching cost trend:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch cost trend'
    });
  }
});

/**
 * GET /api/cost/by-month
 * Get all metrics data for a specific month
 */
router.get('/by-month/:month', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { month } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const result = await pool.request()
      .input('month', sql.NVarChar, month)
      .input('year', sql.Int, Number(year))
      .query(`
        SELECT 
          de.id, de.metric_id, de.target, de.result,
          de.accu_target, de.accu_result, de.forecast, de.reason,
          de.recover_activity, de.forecast_result_total, de.recovery_month,
          m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
          sc.name_en as sub_category_name, sc.[key] as sub_category_key
        FROM cost_data_entries de
        INNER JOIN cost_metrics m ON de.metric_id = m.id
        INNER JOIN cost_sub_categories sc ON m.sub_category_id = sc.id
        WHERE de.month = @month AND de.year = @year
        ORDER BY sc.sort_order, m.no
      `);

    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching cost by month:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch cost by month'
    });
  }
});

/**
 * GET /api/cost/years
 * Get available years for Cost KPI data
 */
router.get('/years', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const result = await pool.request()
      .query(`
        SELECT DISTINCT year 
        FROM cost_data_entries
        ORDER BY year DESC
      `);

    res.json({
      success: true,
      data: result.recordset.map(r => r.year)
    });
  } catch (error) {
    console.error('Error fetching available years:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch available years'
    });
  }
});

/**
 * PUT /api/cost/update
 * Update a data entry
 */
router.put('/update', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { id, target, result, accu_target, accu_result, forecast, reason, recover_activity, forecast_result_total, recovery_month } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Entry ID is required'
      });
    }

    const result_db = await pool.request()
      .input('id', sql.Int, id)
      .input('target', sql.NVarChar, target || null)
      .input('result', sql.NVarChar, result || null)
      .input('accu_target', sql.NVarChar, accu_target || null)
      .input('accu_result', sql.NVarChar, accu_result || null)
      .input('forecast', sql.NVarChar, forecast || null)
      .input('reason', sql.NVarChar, reason || null)
      .input('recover_activity', sql.NVarChar, recover_activity || null)
      .input('forecast_result_total', sql.NVarChar, forecast_result_total || null)
      .input('recovery_month', sql.NVarChar, recovery_month || null)
      .query(`
        UPDATE cost_data_entries
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
        message: 'Entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating cost entry:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to update cost entry'
    });
  }
});

/**
 * GET /api/cost/dashboard
 * Get dashboard overview for Cost KPIs
 */
router.get('/dashboard', async (req, res) => {
  try {
    const pool = await getKpiDb();
    const { year = new Date().getFullYear() } = req.query;

    // Get summary by sub-category
    const summaryResult = await pool.request()
      .input('year', sql.Int, Number(year))
      .query(`
        SELECT 
          sc.id as sub_category_id,
          sc.name_en as sub_category_name,
          sc.[key] as sub_category_key,
          COUNT(m.id) as total_metrics,
          COUNT(de.id) as total_entries,
          COUNT(CASE WHEN de.result IS NOT NULL AND de.result != '' THEN 1 END) as completed_entries
        FROM cost_sub_categories sc
        LEFT JOIN cost_metrics m ON m.sub_category_id = sc.id
        LEFT JOIN cost_data_entries de ON de.metric_id = m.id AND de.year = @year
        GROUP BY sc.id, sc.name_en, sc.[key]
        ORDER BY sc.sort_order
      `);

    // Get latest month data
    const latestMonthResult = await pool.request()
      .input('year', sql.Int, Number(year))
      .query(`
        SELECT TOP 1 de.month, de.year
        FROM cost_data_entries de
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
        latest_month: latestMonthResult.recordset[0] || null
      }
    });
  } catch (error) {
    console.error('Error fetching cost dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch cost dashboard'
    });
  }
});

export default router;
