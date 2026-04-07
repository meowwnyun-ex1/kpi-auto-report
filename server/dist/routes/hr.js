"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const mssql_1 = __importDefault(require("mssql"));
const router = (0, express_1.Router)();
// ============================================
// HR KPI ENDPOINTS
// ============================================
/**
 * Get HR KPI summary for dashboard
 */
router.get('/summary', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        // Get all metrics with latest data entries using OUTER APPLY
        const result = await pool.request().query(`
      SELECT 
        m.id,
        m.no,
        m.measurement,
        m.unit,
        m.main,
        m.main_relate,
        m.fy25_target,
        m.description_of_target,
        sc.name_en as sub_category,
        sc.[key] as sub_category_key,
        latest.target,
        latest.result,
        latest.accu_target,
        latest.accu_result,
        latest.month,
        latest.year,
        latest.forecast,
        latest.reason,
        latest.recover_activity,
        latest.forecast_result_total,
        latest.recovery_month
      FROM hr_metrics m
      INNER JOIN hr_sub_categories sc ON m.sub_category_id = sc.id
      OUTER APPLY (
        SELECT TOP 1 
          TRY_CAST(de.target AS FLOAT) as target,
          TRY_CAST(de.result AS FLOAT) as result,
          TRY_CAST(de.accu_target AS FLOAT) as accu_target,
          TRY_CAST(de.accu_result AS FLOAT) as accu_result,
          de.month,
          de.year,
          de.forecast,
          de.reason,
          de.recover_activity,
          TRY_CAST(de.forecast_result_total AS FLOAT) as forecast_result_total,
          de.recovery_month
        FROM hr_data_entries de
        WHERE de.metric_id = m.id
        ORDER BY de.year DESC, 
          CASE de.month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END DESC
      ) latest
      WHERE m.is_active = 1
      ORDER BY sc.sort_order, m.no
    `);
        // Calculate summary statistics
        const metrics = result.recordset;
        const subCategorySummary = metrics.reduce((acc, m) => {
            if (!acc[m.sub_category_key]) {
                acc[m.sub_category_key] = {
                    name: m.sub_category,
                    key: m.sub_category_key,
                    total_metrics: 0,
                    metrics: [],
                };
            }
            acc[m.sub_category_key].total_metrics++;
            acc[m.sub_category_key].metrics.push({
                id: m.id,
                no: m.no,
                measurement: m.measurement,
                unit: m.unit,
                main: m.main,
                main_relate: m.main_relate,
                fy25_target: m.fy25_target,
                description_of_target: m.description_of_target,
                latest_entry: m.target
                    ? {
                        target: m.target,
                        result: m.result,
                        accu_target: m.accu_target,
                        accu_result: m.accu_result,
                        month: m.month,
                        year: m.year,
                        forecast: m.forecast,
                        reason: m.reason,
                        recover_activity: m.recover_activity,
                        forecast_result_total: m.forecast_result_total,
                        recovery_month: m.recovery_month,
                    }
                    : null,
            });
            return acc;
        }, {});
        const summary = {
            total_metrics: metrics.length,
            sub_categories: Object.values(subCategorySummary),
        };
        res.json(summary);
    }
    catch (error) {
        console.error('Error fetching HR KPI summary:', error);
        res.status(500).json({ error: 'Failed to fetch HR KPI summary' });
    }
});
/**
 * Get HR KPI sub-categories
 */
router.get('/sub-categories', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
      SELECT 
        id,
        name_en,
        name_th,
        [key],
        description,
        sort_order
      FROM hr_sub_categories
      WHERE is_active = 1
      ORDER BY sort_order
    `);
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error fetching HR sub-categories:', error);
        res.status(500).json({ error: 'Failed to fetch HR sub-categories' });
    }
});
/**
 * Get HR KPI metrics by sub-category
 */
router.get('/metrics', async (req, res) => {
    try {
        const { subCategory, year } = req.query;
        const pool = await (0, database_1.getKpiDb)();
        let query = `
      SELECT 
        m.id,
        m.no,
        m.measurement,
        m.unit,
        m.main,
        m.main_relate,
        m.fy25_target,
        m.description_of_target,
        sc.name_en as sub_category,
        sc.[key] as sub_category_key
      FROM hr_metrics m
      INNER JOIN hr_sub_categories sc ON m.sub_category_id = sc.id
      WHERE m.is_active = 1
    `;
        if (subCategory) {
            query += ' AND sc.[key] = @subCategory';
        }
        query += ' ORDER BY sc.sort_order, m.no';
        const request = pool.request();
        if (subCategory) {
            request.input('subCategory', mssql_1.default.NVarChar, subCategory);
        }
        const result = await request.query(query);
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error fetching HR metrics:', error);
        res.status(500).json({ error: 'Failed to fetch HR metrics' });
    }
});
/**
 * Get HR KPI data entries by metric ID
 */
router.get('/metrics/:metricId/entries', async (req, res) => {
    try {
        const metricId = Array.isArray(req.params.metricId)
            ? req.params.metricId[0]
            : req.params.metricId;
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().input('metricId', mssql_1.default.Int, parseInt(metricId)).query(`
        SELECT 
          de.id,
          de.metric_id,
          de.month,
          de.year,
          de.target,
          de.result,
          de.accu_target,
          de.accu_result,
          de.forecast,
          de.reason,
          de.recover_activity,
          de.forecast_result_total,
          de.recovery_month
        FROM hr_data_entries de
        WHERE de.metric_id = @metricId
        ORDER BY de.year, 
          CASE de.month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END
      `);
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error fetching HR KPI entries:', error);
        res.status(500).json({ error: 'Failed to fetch HR KPI entries' });
    }
});
/**
 * Get HR KPI trend data for charts
 */
router.get('/trend', async (req, res) => {
    try {
        const { metricId, year, subCategory } = req.query;
        const pool = await (0, database_1.getKpiDb)();
        let query = `
      SELECT 
        m.id as metric_id,
        m.no,
        m.measurement,
        m.unit,
        m.fy25_target,
        sc.[key] as sub_category_key,
        de.month,
        de.year,
        TRY_CAST(de.target AS FLOAT) as target,
        TRY_CAST(de.result AS FLOAT) as result,
        TRY_CAST(de.accu_target AS FLOAT) as accu_target,
        TRY_CAST(de.accu_result AS FLOAT) as accu_result
      FROM hr_metrics m
      INNER JOIN hr_sub_categories sc ON m.sub_category_id = sc.id
      LEFT JOIN hr_data_entries de ON m.id = de.metric_id
    `;
        const conditions = ['m.is_active = 1'];
        if (metricId) {
            conditions.push('m.id = @metricId');
        }
        if (year) {
            conditions.push('de.year = @year');
        }
        if (subCategory) {
            conditions.push('sc.[key] = @subCategory');
        }
        query += ' WHERE ' + conditions.join(' AND ');
        query += `
      ORDER BY sc.sort_order, m.no, de.year,
        CASE de.month
          WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
          WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
          WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
          WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END
    `;
        const request = pool.request();
        if (metricId) {
            request.input('metricId', mssql_1.default.Int, parseInt(metricId));
        }
        if (year) {
            request.input('year', mssql_1.default.Int, parseInt(year));
        }
        if (subCategory) {
            request.input('subCategory', mssql_1.default.NVarChar, subCategory);
        }
        const result = await request.query(query);
        // Group data by metric for chart display
        const trendData = {};
        result.recordset.forEach((row) => {
            if (!trendData[row.metric_id]) {
                trendData[row.metric_id] = {
                    metric_id: row.metric_id,
                    no: row.no,
                    measurement: row.measurement,
                    unit: row.unit,
                    fy25_target: row.fy25_target,
                    sub_category_key: row.sub_category_key,
                    data: [],
                };
            }
            if (row.month) {
                trendData[row.metric_id].data.push({
                    month: row.month,
                    year: row.year,
                    target: row.target,
                    result: row.result,
                    accu_target: row.accu_target,
                    accu_result: row.accu_result,
                });
            }
        });
        res.json(Object.values(trendData));
    }
    catch (error) {
        console.error('Error fetching HR KPI trend:', error);
        res.status(500).json({ error: 'Failed to fetch HR KPI trend' });
    }
});
/**
 * Get HR KPI summary by sub-category
 */
router.get('/summary/by-subcategory', async (req, res) => {
    try {
        const { year, month } = req.query;
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool
            .request()
            .input('year', mssql_1.default.Int, year ? parseInt(year) : 2025)
            .input('month', mssql_1.default.NVarChar, month || 'Apr').query(`
        SELECT 
          sc.id,
          sc.name_en,
          sc.[key],
          COUNT(m.id) as total_metrics,
          SUM(CASE 
            WHEN de.accu_result IS NOT NULL AND de.accu_target IS NOT NULL 
            AND TRY_CAST(de.accu_result AS FLOAT) >= TRY_CAST(de.accu_target AS FLOAT) 
            THEN 1 ELSE 0 
          END) as achieved_metrics,
          SUM(CASE 
            WHEN de.accu_result IS NOT NULL AND de.accu_target IS NOT NULL 
            AND TRY_CAST(de.accu_result AS FLOAT) < TRY_CAST(de.accu_target AS FLOAT) 
            THEN 1 ELSE 0 
          END) as missed_metrics
        FROM hr_sub_categories sc
        LEFT JOIN hr_metrics m ON sc.id = m.sub_category_id AND m.is_active = 1
        LEFT JOIN hr_data_entries de ON m.id = de.metric_id 
          AND de.year = @year AND de.month = @month
        WHERE sc.is_active = 1
        GROUP BY sc.id, sc.name_en, sc.[key], sc.sort_order
        ORDER BY sc.sort_order
      `);
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error fetching HR summary by sub-category:', error);
        res.status(500).json({ error: 'Failed to fetch HR summary by sub-category' });
    }
});
/**
 * Get HR KPI data by month and year
 */
router.get('/by-month', async (req, res) => {
    try {
        const { year, month, subCategory } = req.query;
        const pool = await (0, database_1.getKpiDb)();
        let query = `
      SELECT 
        m.id,
        m.no,
        m.measurement,
        m.unit,
        m.main,
        m.main_relate,
        m.fy25_target,
        sc.name_en as sub_category,
        sc.[key] as sub_category_key,
        de.target,
        de.result,
        de.accu_target,
        de.accu_result,
        de.forecast,
        de.reason,
        de.recover_activity,
        de.forecast_result_total,
        de.recovery_month
      FROM hr_metrics m
      INNER JOIN hr_sub_categories sc ON m.sub_category_id = sc.id
      LEFT JOIN hr_data_entries de ON m.id = de.metric_id
        AND de.year = @year AND de.month = @month
      WHERE m.is_active = 1
    `;
        if (subCategory) {
            query += ' AND sc.[key] = @subCategory';
        }
        query += ' ORDER BY sc.sort_order, m.no';
        const request = pool
            .request()
            .input('year', mssql_1.default.Int, parseInt(year) || 2025)
            .input('month', mssql_1.default.NVarChar, month || 'Apr');
        if (subCategory) {
            request.input('subCategory', mssql_1.default.NVarChar, subCategory);
        }
        const result = await request.query(query);
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error fetching HR data by month:', error);
        res.status(500).json({ error: 'Failed to fetch HR data by month' });
    }
});
/**
 * Get available years for HR KPI data
 */
router.get('/years', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
      SELECT DISTINCT year 
      FROM hr_data_entries
      ORDER BY year DESC
    `);
        res.json(result.recordset.map((row) => row.year));
    }
    catch (error) {
        console.error('Error fetching available years:', error);
        res.status(500).json({ error: 'Failed to fetch available years' });
    }
});
/**
 * Update HR KPI data entry
 */
router.put('/entries/:id', async (req, res) => {
    try {
        const entryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { target, result, accu_target, accu_result, forecast, reason, recover_activity, forecast_result_total, recovery_month, } = req.body;
        const pool = await (0, database_1.getKpiDb)();
        await pool
            .request()
            .input('id', mssql_1.default.Int, parseInt(entryId))
            .input('target', mssql_1.default.NVarChar, target || null)
            .input('result', mssql_1.default.NVarChar, result || null)
            .input('accu_target', mssql_1.default.NVarChar, accu_target || null)
            .input('accu_result', mssql_1.default.NVarChar, accu_result || null)
            .input('forecast', mssql_1.default.NVarChar, forecast || null)
            .input('reason', mssql_1.default.NVarChar, reason || null)
            .input('recover_activity', mssql_1.default.NVarChar, recover_activity || null)
            .input('forecast_result_total', mssql_1.default.NVarChar, forecast_result_total || null)
            .input('recovery_month', mssql_1.default.NVarChar, recovery_month || null).query(`
        UPDATE hr_data_entries
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
        res.json({ success: true, message: 'Entry updated successfully' });
    }
    catch (error) {
        console.error('Error updating HR entry:', error);
        res.status(500).json({ error: 'Failed to update HR entry' });
    }
});
/**
 * Get HR KPI dashboard overview
 */
router.get('/dashboard', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        // Get overall statistics
        const statsResult = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM hr_metrics WHERE is_active = 1) as total_metrics,
        (SELECT COUNT(*) FROM hr_data_entries) as total_entries,
        (SELECT COUNT(DISTINCT year) FROM hr_data_entries) as years_covered,
        (SELECT COUNT(*) FROM hr_sub_categories WHERE is_active = 1) as total_sub_categories
    `);
        // Get sub-category summary with latest data
        const subCategoryResult = await pool.request().query(`
      SELECT 
        sc.id,
        sc.name_en,
        sc.[key],
        COUNT(m.id) as total_metrics,
        SUM(CASE WHEN latest.accu_result IS NOT NULL THEN 1 ELSE 0 END) as metrics_with_data
      FROM hr_sub_categories sc
      LEFT JOIN hr_metrics m ON sc.id = m.sub_category_id AND m.is_active = 1
      OUTER APPLY (
        SELECT TOP 1 de.accu_result
        FROM hr_data_entries de
        WHERE de.metric_id = m.id
        ORDER BY de.year DESC, 
          CASE de.month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END DESC
      ) latest
      WHERE sc.is_active = 1
      GROUP BY sc.id, sc.name_en, sc.[key], sc.sort_order
      ORDER BY sc.sort_order
    `);
        // Get metrics with issues (result < target for HR metrics where higher is better)
        const issuesResult = await pool.request().query(`
      SELECT TOP 10
        m.no,
        m.measurement,
        m.unit,
        sc.name_en as sub_category,
        latest.accu_target,
        latest.accu_result,
        latest.month,
        latest.year
      FROM hr_metrics m
      INNER JOIN hr_sub_categories sc ON m.sub_category_id = sc.id
      OUTER APPLY (
        SELECT TOP 1 
          TRY_CAST(de.accu_target AS FLOAT) as accu_target,
          TRY_CAST(de.accu_result AS FLOAT) as accu_result,
          de.month,
          de.year
        FROM hr_data_entries de
        WHERE de.metric_id = m.id
        ORDER BY de.year DESC, 
          CASE de.month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END DESC
      ) latest
      WHERE m.is_active = 1
        AND latest.accu_result IS NOT NULL
        AND latest.accu_target IS NOT NULL
        AND latest.accu_result < latest.accu_target
      ORDER BY latest.accu_target - latest.accu_result DESC
    `);
        const dashboard = {
            stats: statsResult.recordset[0],
            sub_categories: subCategoryResult.recordset,
            issues: issuesResult.recordset,
        };
        res.json(dashboard);
    }
    catch (error) {
        console.error('Error fetching HR KPI dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch HR KPI dashboard' });
    }
});
exports.default = router;
// ============================================
// HR BY DEPARTMENT KPI ENDPOINTS
// ============================================
/**
 * Get HR by Department KPI summary for dashboard
 */
router.get('/dept/summary', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        // Get all metrics with latest data entries grouped by department
        const result = await pool.request().query(`
      SELECT 
        m.id,
        m.no,
        m.measurement,
        m.unit,
        m.main,
        m.main_relate,
        m.fy25_target,
        m.description_of_target,
        sc.name_en as sub_category,
        sc.[key] as sub_category_key,
        d.name_en as department,
        d.[key] as department_key,
        latest.target,
        latest.result,
        latest.accu_target,
        latest.accu_result,
        latest.month,
        latest.year,
        latest.forecast,
        latest.reason,
        latest.recover_activity,
        latest.forecast_result_total,
        latest.recovery_month
      FROM hr_dept_metrics m
      INNER JOIN hr_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
      OUTER APPLY (
        SELECT TOP 1 
          TRY_CAST(de.target AS FLOAT) as target,
          TRY_CAST(de.result AS FLOAT) as result,
          TRY_CAST(de.accu_target AS FLOAT) as accu_target,
          TRY_CAST(de.accu_result AS FLOAT) as accu_result,
          de.month,
          de.year,
          de.forecast,
          de.reason,
          de.recover_activity,
          TRY_CAST(de.forecast_result_total AS FLOAT) as forecast_result_total,
          de.recovery_month
        FROM hr_dept_data_entries de
        WHERE de.metric_id = m.id
        ORDER BY de.year DESC, 
          CASE de.month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END DESC
      ) latest
      WHERE m.is_active = 1
      ORDER BY d.sort_order, sc.sort_order, m.no
    `);
        // Calculate summary statistics grouped by department
        const metrics = result.recordset;
        const departmentSummary = metrics.reduce((acc, m) => {
            if (!acc[m.department_key]) {
                acc[m.department_key] = {
                    name: m.department,
                    key: m.department_key,
                    total_metrics: 0,
                    sub_categories: {},
                };
            }
            acc[m.department_key].total_metrics++;
            if (!acc[m.department_key].sub_categories[m.sub_category_key]) {
                acc[m.department_key].sub_categories[m.sub_category_key] = {
                    name: m.sub_category,
                    key: m.sub_category_key,
                    metrics: [],
                };
            }
            acc[m.department_key].sub_categories[m.sub_category_key].metrics.push({
                id: m.id,
                no: m.no,
                measurement: m.measurement,
                unit: m.unit,
                main: m.main,
                main_relate: m.main_relate,
                fy25_target: m.fy25_target,
                description_of_target: m.description_of_target,
                latest_entry: m.target
                    ? {
                        target: m.target,
                        result: m.result,
                        accu_target: m.accu_target,
                        accu_result: m.accu_result,
                        month: m.month,
                        year: m.year,
                        forecast: m.forecast,
                        reason: m.reason,
                        recover_activity: m.recover_activity,
                        forecast_result_total: m.forecast_result_total,
                        recovery_month: m.recovery_month,
                    }
                    : null,
            });
            return acc;
        }, {});
        const summary = {
            total_metrics: metrics.length,
            departments: Object.values(departmentSummary).map((dept) => ({
                ...dept,
                sub_categories: Object.values(dept.sub_categories),
            })),
        };
        res.json(summary);
    }
    catch (error) {
        console.error('Error fetching HR by Department KPI summary:', error);
        res.status(500).json({ error: 'Failed to fetch HR by Department KPI summary' });
    }
});
/**
 * Get departments list
 */
router.get('/dept/departments', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
      SELECT 
        id,
        name_en,
        name_th,
        [key],
        description,
        sort_order
      FROM departments
      WHERE is_active = 1
      ORDER BY sort_order
    `);
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});
/**
 * Get HR by Department KPI sub-categories
 */
router.get('/dept/sub-categories', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
      SELECT 
        id,
        name_en,
        name_th,
        [key],
        description,
        sort_order
      FROM hr_dept_sub_categories
      WHERE is_active = 1
      ORDER BY sort_order
    `);
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error fetching HR by Department sub-categories:', error);
        res.status(500).json({ error: 'Failed to fetch HR by Department sub-categories' });
    }
});
/**
 * Get HR by Department KPI metrics
 */
router.get('/dept/metrics', async (req, res) => {
    try {
        const { department, subCategory, year } = req.query;
        const pool = await (0, database_1.getKpiDb)();
        let query = `
      SELECT 
        m.id,
        m.no,
        m.measurement,
        m.unit,
        m.main,
        m.main_relate,
        m.fy25_target,
        m.description_of_target,
        sc.name_en as sub_category,
        sc.[key] as sub_category_key,
        d.name_en as department,
        d.[key] as department_key
      FROM hr_dept_metrics m
      INNER JOIN hr_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
      WHERE m.is_active = 1
    `;
        if (department) {
            query += ' AND d.[key] = @department';
        }
        if (subCategory) {
            query += ' AND sc.[key] = @subCategory';
        }
        query += ' ORDER BY d.sort_order, sc.sort_order, m.no';
        const request = pool.request();
        if (department) {
            request.input('department', mssql_1.default.NVarChar, department);
        }
        if (subCategory) {
            request.input('subCategory', mssql_1.default.NVarChar, subCategory);
        }
        const result = await request.query(query);
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error fetching HR by Department metrics:', error);
        res.status(500).json({ error: 'Failed to fetch HR by Department metrics' });
    }
});
/**
 * Get HR by Department KPI data entries by metric ID
 */
router.get('/dept/metrics/:metricId/entries', async (req, res) => {
    try {
        const metricId = Array.isArray(req.params.metricId)
            ? req.params.metricId[0]
            : req.params.metricId;
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().input('metricId', mssql_1.default.Int, parseInt(metricId)).query(`
        SELECT 
          de.id,
          de.metric_id,
          de.month,
          de.year,
          de.target,
          de.result,
          de.accu_target,
          de.accu_result,
          de.forecast,
          de.reason,
          de.recover_activity,
          de.forecast_result_total,
          de.recovery_month
        FROM hr_dept_data_entries de
        WHERE de.metric_id = @metricId
        ORDER BY de.year, 
          CASE de.month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END
      `);
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error fetching HR by Department KPI entries:', error);
        res.status(500).json({ error: 'Failed to fetch HR by Department KPI entries' });
    }
});
/**
 * Get HR by Department KPI trend data for charts
 */
router.get('/dept/trend', async (req, res) => {
    try {
        const { metricId, year, department, subCategory } = req.query;
        const pool = await (0, database_1.getKpiDb)();
        let query = `
      SELECT 
        m.id as metric_id,
        m.no,
        m.measurement,
        m.unit,
        m.fy25_target,
        sc.[key] as sub_category_key,
        d.[key] as department_key,
        de.month,
        de.year,
        TRY_CAST(de.target AS FLOAT) as target,
        TRY_CAST(de.result AS FLOAT) as result,
        TRY_CAST(de.accu_target AS FLOAT) as accu_target,
        TRY_CAST(de.accu_result AS FLOAT) as accu_result
      FROM hr_dept_metrics m
      INNER JOIN hr_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
      LEFT JOIN hr_dept_data_entries de ON m.id = de.metric_id
    `;
        const conditions = ['m.is_active = 1'];
        if (metricId) {
            conditions.push('m.id = @metricId');
        }
        if (year) {
            conditions.push('de.year = @year');
        }
        if (department) {
            conditions.push('d.[key] = @department');
        }
        if (subCategory) {
            conditions.push('sc.[key] = @subCategory');
        }
        query += ' WHERE ' + conditions.join(' AND ');
        query += `
      ORDER BY d.sort_order, sc.sort_order, m.no, de.year,
        CASE de.month
          WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
          WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
          WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
          WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END
    `;
        const request = pool.request();
        if (metricId) {
            request.input('metricId', mssql_1.default.Int, parseInt(metricId));
        }
        if (year) {
            request.input('year', mssql_1.default.Int, parseInt(year));
        }
        if (department) {
            request.input('department', mssql_1.default.NVarChar, department);
        }
        if (subCategory) {
            request.input('subCategory', mssql_1.default.NVarChar, subCategory);
        }
        const result = await request.query(query);
        // Group data by metric for chart display
        const trendData = {};
        result.recordset.forEach((row) => {
            if (!trendData[row.metric_id]) {
                trendData[row.metric_id] = {
                    metric_id: row.metric_id,
                    no: row.no,
                    measurement: row.measurement,
                    unit: row.unit,
                    fy25_target: row.fy25_target,
                    sub_category_key: row.sub_category_key,
                    department_key: row.department_key,
                    data: [],
                };
            }
            if (row.month) {
                trendData[row.metric_id].data.push({
                    month: row.month,
                    year: row.year,
                    target: row.target,
                    result: row.result,
                    accu_target: row.accu_target,
                    accu_result: row.accu_result,
                });
            }
        });
        res.json(Object.values(trendData));
    }
    catch (error) {
        console.error('Error fetching HR by Department KPI trend:', error);
        res.status(500).json({ error: 'Failed to fetch HR by Department KPI trend' });
    }
});
/**
 * Get HR by Department KPI data by month and year
 */
router.get('/dept/by-month', async (req, res) => {
    try {
        const { year, month, department, subCategory } = req.query;
        const pool = await (0, database_1.getKpiDb)();
        let query = `
      SELECT 
        m.id,
        m.no,
        m.measurement,
        m.unit,
        m.main,
        m.main_relate,
        m.fy25_target,
        sc.name_en as sub_category,
        sc.[key] as sub_category_key,
        d.name_en as department,
        d.[key] as department_key,
        de.target,
        de.result,
        de.accu_target,
        de.accu_result,
        de.forecast,
        de.reason,
        de.recover_activity,
        de.forecast_result_total,
        de.recovery_month
      FROM hr_dept_metrics m
      INNER JOIN hr_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
      LEFT JOIN hr_dept_data_entries de ON m.id = de.metric_id
        AND de.year = @year AND de.month = @month
      WHERE m.is_active = 1
    `;
        if (department) {
            query += ' AND d.[key] = @department';
        }
        if (subCategory) {
            query += ' AND sc.[key] = @subCategory';
        }
        query += ' ORDER BY d.sort_order, sc.sort_order, m.no';
        const request = pool
            .request()
            .input('year', mssql_1.default.Int, parseInt(year) || 2025)
            .input('month', mssql_1.default.NVarChar, month || 'Apr');
        if (department) {
            request.input('department', mssql_1.default.NVarChar, department);
        }
        if (subCategory) {
            request.input('subCategory', mssql_1.default.NVarChar, subCategory);
        }
        const result = await request.query(query);
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error fetching HR by Department data by month:', error);
        res.status(500).json({ error: 'Failed to fetch HR by Department data by month' });
    }
});
/**
 * Get available years for HR by Department KPI data
 */
router.get('/dept/years', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
      SELECT DISTINCT year 
      FROM hr_dept_data_entries
      ORDER BY year DESC
    `);
        res.json(result.recordset.map((row) => row.year));
    }
    catch (error) {
        console.error('Error fetching available years:', error);
        res.status(500).json({ error: 'Failed to fetch available years' });
    }
});
/**
 * Update HR by Department KPI data entry
 */
router.put('/dept/entries/:id', async (req, res) => {
    try {
        const entryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { target, result, accu_target, accu_result, forecast, reason, recover_activity, forecast_result_total, recovery_month, } = req.body;
        const pool = await (0, database_1.getKpiDb)();
        await pool
            .request()
            .input('id', mssql_1.default.Int, parseInt(entryId))
            .input('target', mssql_1.default.NVarChar, target || null)
            .input('result', mssql_1.default.NVarChar, result || null)
            .input('accu_target', mssql_1.default.NVarChar, accu_target || null)
            .input('accu_result', mssql_1.default.NVarChar, accu_result || null)
            .input('forecast', mssql_1.default.NVarChar, forecast || null)
            .input('reason', mssql_1.default.NVarChar, reason || null)
            .input('recover_activity', mssql_1.default.NVarChar, recover_activity || null)
            .input('forecast_result_total', mssql_1.default.NVarChar, forecast_result_total || null)
            .input('recovery_month', mssql_1.default.NVarChar, recovery_month || null).query(`
        UPDATE hr_dept_data_entries
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
        res.json({ success: true, message: 'Entry updated successfully' });
    }
    catch (error) {
        console.error('Error updating HR by Department entry:', error);
        res.status(500).json({ error: 'Failed to update HR by Department entry' });
    }
});
/**
 * Get HR by Department KPI dashboard overview
 */
router.get('/dept/dashboard', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        // Get overall statistics
        const statsResult = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM hr_dept_metrics WHERE is_active = 1) as total_metrics,
        (SELECT COUNT(*) FROM hr_dept_data_entries) as total_entries,
        (SELECT COUNT(DISTINCT year) FROM hr_dept_data_entries) as years_covered,
        (SELECT COUNT(*) FROM departments WHERE is_active = 1) as total_departments,
        (SELECT COUNT(*) FROM hr_dept_sub_categories WHERE is_active = 1) as total_sub_categories
    `);
        // Get department summary with latest data
        const departmentResult = await pool.request().query(`
      SELECT 
        d.id,
        d.name_en,
        d.[key],
        COUNT(m.id) as total_metrics,
        SUM(CASE WHEN latest.accu_result IS NOT NULL THEN 1 ELSE 0 END) as metrics_with_data
      FROM departments d
      LEFT JOIN hr_dept_metrics m ON d.id = m.department_id AND m.is_active = 1
      OUTER APPLY (
        SELECT TOP 1 de.accu_result
        FROM hr_dept_data_entries de
        WHERE de.metric_id = m.id
        ORDER BY de.year DESC, 
          CASE de.month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END DESC
      ) latest
      WHERE d.is_active = 1
      GROUP BY d.id, d.name_en, d.[key], d.sort_order
      ORDER BY d.sort_order
    `);
        // Get metrics with issues (result < target for HR metrics where higher is better)
        const issuesResult = await pool.request().query(`
      SELECT TOP 10
        m.no,
        m.measurement,
        m.unit,
        sc.name_en as sub_category,
        d.name_en as department,
        latest.accu_target,
        latest.accu_result,
        latest.month,
        latest.year
      FROM hr_dept_metrics m
      INNER JOIN hr_dept_sub_categories sc ON m.sub_category_id = sc.id
      INNER JOIN departments d ON m.department_id = d.id
      OUTER APPLY (
        SELECT TOP 1 
          TRY_CAST(de.accu_target AS FLOAT) as accu_target,
          TRY_CAST(de.accu_result AS FLOAT) as accu_result,
          de.month,
          de.year
        FROM hr_dept_data_entries de
        WHERE de.metric_id = m.id
        ORDER BY de.year DESC, 
          CASE de.month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END DESC
      ) latest
      WHERE m.is_active = 1
        AND latest.accu_result IS NOT NULL
        AND latest.accu_target IS NOT NULL
        AND latest.accu_result < latest.accu_target
      ORDER BY latest.accu_target - latest.accu_result DESC
    `);
        const dashboard = {
            stats: statsResult.recordset[0],
            departments: departmentResult.recordset,
            issues: issuesResult.recordset,
        };
        res.json(dashboard);
    }
    catch (error) {
        console.error('Error fetching HR by Department KPI dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch HR by Department KPI dashboard' });
    }
});
exports.default = router;
