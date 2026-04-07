"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const mssql_1 = __importDefault(require("mssql"));
const router = express_1.default.Router();
// ============================================
// ATTRACTIVE KPI ROUTES
// ============================================
/**
 * GET /api/attractive/summary
 * Get overall summary of Attractive KPIs
 */
router.get('/summary', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { year = new Date().getFullYear() } = req.query;
        const result = await pool.request().input('year', mssql_1.default.Int, Number(year)).query(`
        SELECT 
          COUNT(DISTINCT m.id) as total_metrics,
          COUNT(DISTINCT sc.id) as total_sub_categories,
          COUNT(DISTINCT de.id) as total_entries,
          COUNT(CASE WHEN de.result IS NOT NULL AND de.result != '' THEN 1 END) as completed_entries
        FROM attractive_metrics m
        LEFT JOIN attractive_sub_categories sc ON m.sub_category_id = sc.id
        LEFT JOIN attractive_data_entries de ON de.metric_id = m.id AND de.year = @year
      `);
        res.json({
            success: true,
            data: result.recordset[0],
        });
    }
    catch (error) {
        console.error('Error fetching attractive summary:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive summary',
        });
    }
});
/**
 * GET /api/attractive/sub-categories
 * Get all sub-categories for Attractive KPIs
 */
router.get('/sub-categories', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
        SELECT id, name_en, name_th, [key], sort_order, created_at, updated_at
        FROM attractive_sub_categories
        ORDER BY sort_order
      `);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching attractive sub-categories:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive sub-categories',
        });
    }
});
/**
 * GET /api/attractive/metrics
 * Get all metrics for Attractive KPIs
 */
router.get('/metrics', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { sub_category } = req.query;
        let query = `
      SELECT 
        m.id, m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate,
        m.description_of_target, m.sub_category_id, sc.name_en as sub_category_name,
        sc.[key] as sub_category_key
      FROM attractive_metrics m
      INNER JOIN attractive_sub_categories sc ON m.sub_category_id = sc.id
    `;
        if (sub_category) {
            query += ` WHERE sc.[key] = @sub_category`;
        }
        query += ` ORDER BY sc.sort_order, m.no`;
        const request = pool.request();
        if (sub_category) {
            request.input('sub_category', mssql_1.default.NVarChar, sub_category);
        }
        const result = await request.query(query);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching attractive metrics:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive metrics',
        });
    }
});
/**
 * GET /api/attractive/entries
 * Get data entries for Attractive KPIs
 */
router.get('/entries', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { year = new Date().getFullYear(), month, sub_category } = req.query;
        let query = `
      SELECT 
        de.id, de.metric_id, de.month, de.year, de.target, de.result,
        de.accu_target, de.accu_result, de.forecast, de.reason,
        de.recover_activity, de.forecast_result_total, de.recovery_month, de.remark,
        m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key
      FROM attractive_data_entries de
      INNER JOIN attractive_metrics m ON de.metric_id = m.id
      INNER JOIN attractive_sub_categories sc ON m.sub_category_id = sc.id
      WHERE de.year = @year
    `;
        const request = pool.request().input('year', mssql_1.default.Int, Number(year));
        if (month) {
            query += ` AND de.month = @month`;
            request.input('month', mssql_1.default.NVarChar, month);
        }
        if (sub_category) {
            query += ` AND sc.[key] = @sub_category`;
            request.input('sub_category', mssql_1.default.NVarChar, sub_category);
        }
        query += ` ORDER BY sc.sort_order, m.no, de.month`;
        const result = await request.query(query);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching attractive entries:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive entries',
        });
    }
});
/**
 * GET /api/attractive/trend
 * Get trend data for a specific metric
 */
router.get('/trend/:metricId', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { metricId } = req.params;
        const { year = new Date().getFullYear() } = req.query;
        const result = await pool
            .request()
            .input('metricId', mssql_1.default.Int, Number(metricId))
            .input('year', mssql_1.default.Int, Number(year)).query(`
        SELECT 
          de.id, de.month, de.year, de.target, de.result,
          de.accu_target, de.accu_result, de.forecast,
          m.no, m.measurement, m.unit, m.fy25_target
        FROM attractive_data_entries de
        INNER JOIN attractive_metrics m ON de.metric_id = m.id
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
    }
    catch (error) {
        console.error('Error fetching attractive trend:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive trend',
        });
    }
});
/**
 * GET /api/attractive/by-month
 * Get all metrics data for a specific month
 */
router.get('/by-month/:month', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { month } = req.params;
        const { year = new Date().getFullYear() } = req.query;
        const result = await pool
            .request()
            .input('month', mssql_1.default.NVarChar, month)
            .input('year', mssql_1.default.Int, Number(year)).query(`
        SELECT 
          de.id, de.metric_id, de.target, de.result,
          de.accu_target, de.accu_result, de.forecast, de.reason,
          de.recover_activity, de.forecast_result_total, de.recovery_month, de.remark,
          m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
          sc.name_en as sub_category_name, sc.[key] as sub_category_key
        FROM attractive_data_entries de
        INNER JOIN attractive_metrics m ON de.metric_id = m.id
        INNER JOIN attractive_sub_categories sc ON m.sub_category_id = sc.id
        WHERE de.month = @month AND de.year = @year
        ORDER BY sc.sort_order, m.no
      `);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching attractive by month:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive by month',
        });
    }
});
/**
 * GET /api/attractive/years
 * Get available years for Attractive KPI data
 */
router.get('/years', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
        SELECT DISTINCT year 
        FROM attractive_data_entries
        ORDER BY year DESC
      `);
        res.json({
            success: true,
            data: result.recordset.map((r) => r.year),
        });
    }
    catch (error) {
        console.error('Error fetching available years:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch available years',
        });
    }
});
/**
 * PUT /api/attractive/update
 * Update a data entry
 */
router.put('/update', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { id, target, result, accu_target, accu_result, forecast, reason, recover_activity, forecast_result_total, recovery_month, remark, } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Entry ID is required',
            });
        }
        const result_db = await pool
            .request()
            .input('id', mssql_1.default.Int, id)
            .input('target', mssql_1.default.NVarChar, target || null)
            .input('result', mssql_1.default.NVarChar, result || null)
            .input('accu_target', mssql_1.default.NVarChar, accu_target || null)
            .input('accu_result', mssql_1.default.NVarChar, accu_result || null)
            .input('forecast', mssql_1.default.NVarChar, forecast || null)
            .input('reason', mssql_1.default.NVarChar, reason || null)
            .input('recover_activity', mssql_1.default.NVarChar, recover_activity || null)
            .input('forecast_result_total', mssql_1.default.NVarChar, forecast_result_total || null)
            .input('recovery_month', mssql_1.default.NVarChar, recovery_month || null)
            .input('remark', mssql_1.default.NVarChar, remark || null).query(`
        UPDATE attractive_data_entries
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
          remark = @remark,
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
    }
    catch (error) {
        console.error('Error updating attractive entry:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to update attractive entry',
        });
    }
});
/**
 * GET /api/attractive/dashboard
 * Get dashboard overview for Attractive KPIs
 */
router.get('/dashboard', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { year = new Date().getFullYear() } = req.query;
        // Get summary by sub-category
        const summaryResult = await pool.request().input('year', mssql_1.default.Int, Number(year)).query(`
        SELECT 
          sc.id as sub_category_id,
          sc.name_en as sub_category_name,
          sc.[key] as sub_category_key,
          COUNT(m.id) as total_metrics,
          COUNT(de.id) as total_entries,
          COUNT(CASE WHEN de.result IS NOT NULL AND de.result != '' THEN 1 END) as completed_entries
        FROM attractive_sub_categories sc
        LEFT JOIN attractive_metrics m ON m.sub_category_id = sc.id
        LEFT JOIN attractive_data_entries de ON de.metric_id = m.id AND de.year = @year
        GROUP BY sc.id, sc.name_en, sc.[key]
        ORDER BY sc.sort_order
      `);
        // Get latest month data
        const latestMonthResult = await pool.request().input('year', mssql_1.default.Int, Number(year)).query(`
        SELECT TOP 1 de.month, de.year
        FROM attractive_data_entries de
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
    }
    catch (error) {
        console.error('Error fetching attractive dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive dashboard',
        });
    }
});
exports.default = router;
// ============================================
// ATTRACTIVE BY DEPARTMENT KPI ROUTES
// ============================================
/**
 * GET /api/attractive/dept/summary
 * Get overall summary of Attractive by Department KPIs
 */
router.get('/dept/summary', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { year = new Date().getFullYear() } = req.query;
        const result = await pool.request().input('year', mssql_1.default.Int, Number(year)).query(`
        SELECT 
          COUNT(DISTINCT m.id) as total_metrics,
          COUNT(DISTINCT sc.id) as total_sub_categories,
          COUNT(DISTINCT d.id) as total_departments,
          COUNT(DISTINCT de.id) as total_entries
        FROM attractive_dept_metrics m
        LEFT JOIN attractive_dept_sub_categories sc ON m.sub_category_id = sc.id
        LEFT JOIN departments d ON m.department_id = d.id
        LEFT JOIN attractive_dept_data_entries de ON de.metric_id = m.id AND de.year = @year
      `);
        res.json({
            success: true,
            data: result.recordset[0],
        });
    }
    catch (error) {
        console.error('Error fetching attractive by dept summary:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive by dept summary',
        });
    }
});
/**
 * GET /api/attractive/dept/departments
 * Get all departments
 */
router.get('/dept/departments', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
        SELECT id, name_en, name_th, [key], sort_order, created_at, updated_at
        FROM departments
        ORDER BY sort_order
      `);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch departments',
        });
    }
});
/**
 * GET /api/attractive/dept/sub-categories
 * Get all sub-categories for Attractive by Department KPIs
 */
router.get('/dept/sub-categories', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
        SELECT id, name_en, name_th, [key], sort_order, created_at, updated_at
        FROM attractive_dept_sub_categories
        ORDER BY sort_order
      `);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching attractive dept sub-categories:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive dept sub-categories',
        });
    }
});
/**
 * GET /api/attractive/dept/metrics
 * Get all metrics for Attractive by Department KPIs
 */
router.get('/dept/metrics', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { sub_category, department } = req.query;
        let query = `
      SELECT 
        m.id, m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate,
        m.description_of_target, m.sub_category_id, m.department_id,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key,
        d.name_en as department_name, d.[key] as department_key
      FROM attractive_dept_metrics m
      INNER JOIN attractive_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
    `;
        const conditions = [];
        const request = pool.request();
        if (sub_category) {
            conditions.push('sc.[key] = @sub_category');
            request.input('sub_category', mssql_1.default.NVarChar, sub_category);
        }
        if (department) {
            conditions.push('d.[key] = @department');
            request.input('department', mssql_1.default.NVarChar, department);
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
    }
    catch (error) {
        console.error('Error fetching attractive dept metrics:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive dept metrics',
        });
    }
});
/**
 * GET /api/attractive/dept/entries
 * Get data entries for Attractive by Department KPIs
 */
router.get('/dept/entries', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { year = new Date().getFullYear(), month, sub_category, department } = req.query;
        let query = `
      SELECT 
        de.id, de.metric_id, de.month, de.year, de.result,
        m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key,
        d.name_en as department_name, d.[key] as department_key
      FROM attractive_dept_data_entries de
      INNER JOIN attractive_dept_metrics m ON de.metric_id = m.id
      INNER JOIN attractive_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
      WHERE de.year = @year
    `;
        const request = pool.request().input('year', mssql_1.default.Int, Number(year));
        if (month) {
            query += ` AND de.month = @month`;
            request.input('month', mssql_1.default.NVarChar, month);
        }
        if (sub_category) {
            query += ` AND sc.[key] = @sub_category`;
            request.input('sub_category', mssql_1.default.NVarChar, sub_category);
        }
        if (department) {
            query += ` AND d.[key] = @department`;
            request.input('department', mssql_1.default.NVarChar, department);
        }
        query += ` ORDER BY d.sort_order, sc.sort_order, m.no, de.month`;
        const result = await request.query(query);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching attractive dept entries:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive dept entries',
        });
    }
});
/**
 * GET /api/attractive/dept/by-department/:departmentKey
 * Get all metrics data for a specific department
 */
router.get('/dept/by-department/:departmentKey', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { departmentKey } = req.params;
        const { year = new Date().getFullYear(), month } = req.query;
        let query = `
      SELECT 
        de.id, de.metric_id, de.month, de.year, de.result,
        m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key,
        d.name_en as department_name, d.[key] as department_key
      FROM attractive_dept_data_entries de
      INNER JOIN attractive_dept_metrics m ON de.metric_id = m.id
      INNER JOIN attractive_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
      WHERE d.[key] = @departmentKey AND de.year = @year
    `;
        const request = pool
            .request()
            .input('departmentKey', mssql_1.default.NVarChar, departmentKey)
            .input('year', mssql_1.default.Int, Number(year));
        if (month) {
            query += ` AND de.month = @month`;
            request.input('month', mssql_1.default.NVarChar, month);
        }
        query += ` ORDER BY sc.sort_order, m.no`;
        const result = await request.query(query);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching attractive by department:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive by department',
        });
    }
});
/**
 * GET /api/attractive/dept/by-month/:month
 * Get all metrics data for a specific month
 */
router.get('/dept/by-month/:month', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { month } = req.params;
        const { year = new Date().getFullYear(), department } = req.query;
        let query = `
      SELECT 
        de.id, de.metric_id, de.result,
        m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key,
        d.name_en as department_name, d.[key] as department_key
      FROM attractive_dept_data_entries de
      INNER JOIN attractive_dept_metrics m ON de.metric_id = m.id
      INNER JOIN attractive_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
      WHERE de.month = @month AND de.year = @year
    `;
        const request = pool
            .request()
            .input('month', mssql_1.default.NVarChar, month)
            .input('year', mssql_1.default.Int, Number(year));
        if (department) {
            query += ` AND d.[key] = @department`;
            request.input('department', mssql_1.default.NVarChar, department);
        }
        query += ` ORDER BY d.sort_order, sc.sort_order, m.no`;
        const result = await request.query(query);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching attractive dept by month:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive dept by month',
        });
    }
});
/**
 * GET /api/attractive/dept/compare
 * Compare departments for a specific metric
 */
router.get('/dept/compare', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { year = new Date().getFullYear(), month, sub_category } = req.query;
        let query = `
      SELECT 
        d.id as department_id,
        d.name_en as department_name,
        d.[key] as department_key,
        SUM(CASE WHEN de.result IS NOT NULL AND de.result != '' 
          THEN TRY_CAST(de.result AS FLOAT) ELSE 0 END) as total_result
      FROM departments d
      LEFT JOIN attractive_dept_metrics m ON m.department_id = d.id
      LEFT JOIN attractive_dept_sub_categories sc ON m.sub_category_id = sc.id
      LEFT JOIN attractive_dept_data_entries de ON de.metric_id = m.id AND de.year = @year
    `;
        const request = pool.request().input('year', mssql_1.default.Int, Number(year));
        const conditions = [];
        if (month) {
            conditions.push('de.month = @month');
            request.input('month', mssql_1.default.NVarChar, month);
        }
        if (sub_category) {
            conditions.push('sc.[key] = @sub_category');
            request.input('sub_category', mssql_1.default.NVarChar, sub_category);
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
    }
    catch (error) {
        console.error('Error comparing departments:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to compare departments',
        });
    }
});
/**
 * GET /api/attractive/dept/years
 * Get available years for Attractive by Department KPI data
 */
router.get('/dept/years', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
        SELECT DISTINCT year 
        FROM attractive_dept_data_entries
        ORDER BY year DESC
      `);
        res.json({
            success: true,
            data: result.recordset.map((r) => r.year),
        });
    }
    catch (error) {
        console.error('Error fetching available years:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch available years',
        });
    }
});
/**
 * PUT /api/attractive/dept/update
 * Update a data entry
 */
router.put('/dept/update', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
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
            .input('id', mssql_1.default.Int, id)
            .input('result', mssql_1.default.NVarChar, result || null).query(`
        UPDATE attractive_dept_data_entries
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
    }
    catch (error) {
        console.error('Error updating attractive dept entry:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to update attractive dept entry',
        });
    }
});
/**
 * GET /api/attractive/dept/dashboard
 * Get dashboard overview for Attractive by Department KPIs
 */
router.get('/dept/dashboard', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { year = new Date().getFullYear() } = req.query;
        // Get summary by department
        const summaryResult = await pool.request().input('year', mssql_1.default.Int, Number(year)).query(`
        SELECT 
          d.id as department_id,
          d.name_en as department_name,
          d.[key] as department_key,
          COUNT(m.id) as total_metrics,
          COUNT(de.id) as total_entries,
          COUNT(CASE WHEN de.result IS NOT NULL AND de.result != '' THEN 1 END) as completed_entries
        FROM departments d
        LEFT JOIN attractive_dept_metrics m ON m.department_id = d.id
        LEFT JOIN attractive_dept_data_entries de ON de.metric_id = m.id AND de.year = @year
        GROUP BY d.id, d.name_en, d.[key], d.sort_order
        ORDER BY d.sort_order
      `);
        // Get latest month data
        const latestMonthResult = await pool.request().input('year', mssql_1.default.Int, Number(year)).query(`
        SELECT TOP 1 de.month, de.year
        FROM attractive_dept_data_entries de
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
    }
    catch (error) {
        console.error('Error fetching attractive dept dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch attractive dept dashboard',
        });
    }
});
exports.default = router;
