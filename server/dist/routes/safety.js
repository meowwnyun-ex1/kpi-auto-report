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
// SAFETY KPI ROUTES
// ============================================
/**
 * GET /api/safety/summary
 * Get overall summary of Safety KPIs
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
        FROM safety_metrics m
        LEFT JOIN safety_sub_categories sc ON m.sub_category_id = sc.id
        LEFT JOIN safety_data_entries de ON de.metric_id = m.id AND de.year = @year
      `);
        res.json({
            success: true,
            data: result.recordset[0],
        });
    }
    catch (error) {
        console.error('Error fetching safety summary:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety summary',
        });
    }
});
/**
 * GET /api/safety/sub-categories
 * Get all sub-categories for Safety KPIs
 */
router.get('/sub-categories', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
        SELECT id, name_en, name_th, [key], sort_order, created_at, updated_at
        FROM safety_sub_categories
        ORDER BY sort_order
      `);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching safety sub-categories:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety sub-categories',
        });
    }
});
/**
 * GET /api/safety/metrics
 * Get all metrics for Safety KPIs
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
      FROM safety_metrics m
      INNER JOIN safety_sub_categories sc ON m.sub_category_id = sc.id
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
        console.error('Error fetching safety metrics:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety metrics',
        });
    }
});
/**
 * GET /api/safety/entries
 * Get data entries for Safety KPIs
 */
router.get('/entries', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { year = new Date().getFullYear(), month, sub_category } = req.query;
        let query = `
      SELECT 
        de.id, de.metric_id, de.month, de.year, de.target, de.result,
        de.accu_target, de.accu_result,
        de.reason, de.recover_activity, de.forecast_result_total, de.recovery_month,
        m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key
      FROM safety_data_entries de
      INNER JOIN safety_metrics m ON de.metric_id = m.id
      INNER JOIN safety_sub_categories sc ON m.sub_category_id = sc.id
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
        console.error('Error fetching safety entries:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety entries',
        });
    }
});
/**
 * GET /api/safety/trend
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
          de.accu_target, de.accu_result,
          m.no, m.measurement, m.unit, m.fy25_target
        FROM safety_data_entries de
        INNER JOIN safety_metrics m ON de.metric_id = m.id
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
        console.error('Error fetching safety trend:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety trend',
        });
    }
});
/**
 * GET /api/safety/by-month
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
          de.accu_target, de.accu_result,
          m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
          sc.name_en as sub_category_name, sc.[key] as sub_category_key
        FROM safety_data_entries de
        INNER JOIN safety_metrics m ON de.metric_id = m.id
        INNER JOIN safety_sub_categories sc ON m.sub_category_id = sc.id
        WHERE de.month = @month AND de.year = @year
        ORDER BY sc.sort_order, m.no
      `);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching safety by month:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety by month',
        });
    }
});
/**
 * GET /api/safety/years
 * Get available years for Safety KPI data
 */
router.get('/years', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
        SELECT DISTINCT year 
        FROM safety_data_entries
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
 * PUT /api/safety/update
 * Update a data entry
 */
router.put('/update', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { id, target, result, accu_target, accu_result, reason, recover_activity, forecast_result_total, recovery_month, } = req.body;
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
            .input('reason', mssql_1.default.NVarChar, reason || null)
            .input('recover_activity', mssql_1.default.NVarChar, recover_activity || null)
            .input('forecast_result_total', mssql_1.default.NVarChar, forecast_result_total || null)
            .input('recovery_month', mssql_1.default.NVarChar, recovery_month || null).query(`
        UPDATE safety_data_entries
        SET 
          target = @target,
          result = @result,
          accu_target = @accu_target,
          accu_result = @accu_result,
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
    }
    catch (error) {
        console.error('Error updating safety entry:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to update safety entry',
        });
    }
});
/**
 * GET /api/safety/dashboard
 * Get dashboard overview for Safety KPIs
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
        FROM safety_sub_categories sc
        LEFT JOIN safety_metrics m ON m.sub_category_id = sc.id
        LEFT JOIN safety_data_entries de ON de.metric_id = m.id AND de.year = @year
        GROUP BY sc.id, sc.name_en, sc.[key]
        ORDER BY sc.sort_order
      `);
        // Get latest month data
        const latestMonthResult = await pool.request().input('year', mssql_1.default.Int, Number(year)).query(`
        SELECT TOP 1 de.month, de.year
        FROM safety_data_entries de
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
        console.error('Error fetching safety dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety dashboard',
        });
    }
});
// ============================================
// SAFETY BY DEPARTMENT KPI ROUTES
// ============================================
/**
 * GET /api/safety/dept/summary
 * Get overall summary of Safety by Department KPIs
 */
router.get('/dept/summary', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { year = new Date().getFullYear() } = req.query;
        const result = await pool.request().input('year', mssql_1.default.Int, Number(year)).query(`
        SELECT 
          COUNT(DISTINCT m.id) as total_metrics,
          COUNT(DISTINCT sc.id) as total_sub_categories,
          COUNT(DISTINCT de.id) as total_entries,
          COUNT(DISTINCT de.department_id) as total_departments,
          COUNT(CASE WHEN de.result IS NOT NULL AND de.result != '' THEN 1 END) as completed_entries
        FROM safety_dept_metrics m
        LEFT JOIN safety_dept_sub_categories sc ON m.sub_category_id = sc.id
        LEFT JOIN safety_dept_data_entries de ON de.metric_id = m.id AND de.year = @year
      `);
        res.json({
            success: true,
            data: result.recordset[0],
        });
    }
    catch (error) {
        console.error('Error fetching safety by dept summary:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety by dept summary',
        });
    }
});
/**
 * GET /api/safety/dept/sub-categories
 * Get all sub-categories for Safety by Department KPIs
 */
router.get('/dept/sub-categories', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
        SELECT id, name_en, name_th, [key], sort_order, created_at, updated_at
        FROM safety_dept_sub_categories
        ORDER BY sort_order
      `);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching safety by dept sub-categories:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety by dept sub-categories',
        });
    }
});
/**
 * GET /api/safety/dept/departments
 * Get all departments with Safety data
 */
router.get('/dept/departments', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
        SELECT DISTINCT d.id, d.name, d.code
        FROM departments d
        INNER JOIN safety_dept_data_entries de ON d.id = de.department_id
        ORDER BY d.name
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
 * GET /api/safety/dept/metrics
 * Get all metrics for Safety by Department KPIs
 */
router.get('/dept/metrics', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { sub_category } = req.query;
        let query = `
      SELECT 
        m.id, m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate,
        m.description_of_target, m.sub_category_id, sc.name_en as sub_category_name,
        sc.[key] as sub_category_key
      FROM safety_dept_metrics m
      INNER JOIN safety_dept_sub_categories sc ON m.sub_category_id = sc.id
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
        console.error('Error fetching safety by dept metrics:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety by dept metrics',
        });
    }
});
/**
 * GET /api/safety/dept/entries
 * Get data entries for Safety by Department KPIs
 */
router.get('/dept/entries', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { year = new Date().getFullYear(), month, sub_category, department_id } = req.query;
        let query = `
      SELECT 
        de.id, de.metric_id, de.department_id, de.month, de.year, 
        de.target, de.result, de.accu_target, de.accu_result,
        m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key,
        d.name as department_name, d.code as department_code
      FROM safety_dept_data_entries de
      INNER JOIN safety_dept_metrics m ON de.metric_id = m.id
      INNER JOIN safety_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON de.department_id = d.id
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
        if (department_id) {
            query += ` AND de.department_id = @department_id`;
            request.input('department_id', mssql_1.default.Int, Number(department_id));
        }
        query += ` ORDER BY sc.sort_order, m.no, d.name, de.month`;
        const result = await request.query(query);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching safety by dept entries:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety by dept entries',
        });
    }
});
/**
 * GET /api/safety/dept/by-department/:departmentId
 * Get all metrics data for a specific department
 */
router.get('/dept/by-department/:departmentId', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { departmentId } = req.params;
        const { year = new Date().getFullYear(), month } = req.query;
        let query = `
      SELECT 
        de.id, de.metric_id, de.month, de.year, 
        de.target, de.result, de.accu_target, de.accu_result,
        m.no, m.measurement, m.unit, m.fy25_target, m.main, m.main_relate, m.description_of_target,
        sc.name_en as sub_category_name, sc.[key] as sub_category_key
      FROM safety_dept_data_entries de
      INNER JOIN safety_dept_metrics m ON de.metric_id = m.id
      INNER JOIN safety_dept_sub_categories sc ON m.sub_category_id = sc.id
      WHERE de.department_id = @department_id AND de.year = @year
    `;
        const request = pool
            .request()
            .input('department_id', mssql_1.default.Int, Number(departmentId))
            .input('year', mssql_1.default.Int, Number(year));
        if (month) {
            query += ` AND de.month = @month`;
            request.input('month', mssql_1.default.NVarChar, month);
        }
        query += ` ORDER BY sc.sort_order, m.no, de.month`;
        const result = await request.query(query);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        console.error('Error fetching safety by department:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety by department',
        });
    }
});
/**
 * GET /api/safety/dept/years
 * Get available years for Safety by Department KPI data
 */
router.get('/dept/years', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
        SELECT DISTINCT year 
        FROM safety_dept_data_entries
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
 * PUT /api/safety/dept/update
 * Update a data entry
 */
router.put('/dept/update', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const { id, target, result, accu_target, accu_result } = req.body;
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
            .input('accu_result', mssql_1.default.NVarChar, accu_result || null).query(`
        UPDATE safety_dept_data_entries
        SET 
          target = @target,
          result = @result,
          accu_target = @accu_target,
          accu_result = @accu_result,
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
        console.error('Error updating safety by dept entry:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to update safety by dept entry',
        });
    }
});
/**
 * GET /api/safety/dept/dashboard
 * Get dashboard overview for Safety by Department KPIs
 */
router.get('/dept/dashboard', async (req, res) => {
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
        FROM safety_dept_sub_categories sc
        LEFT JOIN safety_dept_metrics m ON m.sub_category_id = sc.id
        LEFT JOIN safety_dept_data_entries de ON de.metric_id = m.id AND de.year = @year
        GROUP BY sc.id, sc.name_en, sc.[key]
        ORDER BY sc.sort_order
      `);
        // Get summary by department
        const deptSummaryResult = await pool.request().input('year', mssql_1.default.Int, Number(year)).query(`
        SELECT 
          d.id as department_id,
          d.name as department_name,
          d.code as department_code,
          COUNT(DISTINCT de.metric_id) as total_metrics,
          COUNT(de.id) as total_entries,
          COUNT(CASE WHEN de.result IS NOT NULL AND de.result != '' THEN 1 END) as completed_entries
        FROM departments d
        LEFT JOIN safety_dept_data_entries de ON d.id = de.department_id AND de.year = @year
        GROUP BY d.id, d.name, d.code
        HAVING COUNT(de.id) > 0
        ORDER BY d.name
      `);
        // Get latest month data
        const latestMonthResult = await pool.request().input('year', mssql_1.default.Int, Number(year)).query(`
        SELECT TOP 1 de.month, de.year
        FROM safety_dept_data_entries de
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
                summary_by_department: deptSummaryResult.recordset,
                latest_month: latestMonthResult.recordset[0] || null,
            },
        });
    }
    catch (error) {
        console.error('Error fetching safety by dept dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Failed to fetch safety by dept dashboard',
        });
    }
});
exports.default = router;
