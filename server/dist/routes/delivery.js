"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const mssql_1 = __importDefault(require("mssql"));
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Get all delivery sub-categories with metrics
router.get('/sub-categories', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
      SELECT 
        sc.id,
        sc.name_en,
        sc.name_th,
        sc.key,
        sc.description,
        sc.sort_order,
        (SELECT COUNT(*) FROM delivery_metrics WHERE sub_category_id = sc.id) as metric_count
      FROM delivery_sub_categories sc
      ORDER BY sc.sort_order
    `);
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        logger_1.logger.error('Error fetching delivery sub-categories:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch sub-categories' });
    }
});
// Get all delivery metrics with latest data
router.get('/metrics', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
      SELECT 
        m.id,
        m.no,
        m.measurement,
        m.unit,
        m.main,
        m.main_relate,
        m.fy25_target,
        m.is_active,
        sc.name_en as sub_category_name,
        sc.key as sub_category_key,
        latest.month as latest_month,
        latest.year as latest_year,
        latest.target as latest_target,
        latest.result as latest_result,
        latest.accu_target as accu_target,
        latest.accu_result as accu_result,
        latest.forecast as forecast,
        latest.reason as reason,
        latest.recover_activity as recover_activity
      FROM delivery_metrics m
      JOIN delivery_sub_categories sc ON m.sub_category_id = sc.id
      OUTER APPLY (
        SELECT TOP 1 *
        FROM delivery_data_entries de
        WHERE de.metric_id = m.id
        ORDER BY de.year DESC, de.month DESC
      ) latest
      ORDER BY sc.sort_order, m.no
    `);
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        logger_1.logger.error('Error fetching delivery metrics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
    }
});
// Get delivery data entries by metric ID
router.get('/metrics/:metricId/entries', async (req, res) => {
    try {
        const { metricId } = req.params;
        const { year } = req.query;
        const pool = await (0, database_1.getKpiDb)();
        let query = `
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
      FROM delivery_data_entries de
      WHERE de.metric_id = @metricId
    `;
        if (year) {
            query += ` AND de.year = @year`;
        }
        query += ` ORDER BY de.year, CASE 
      WHEN de.month = 'Jan' THEN 1
      WHEN de.month = 'Feb' THEN 2
      WHEN de.month = 'Mar' THEN 3
      WHEN de.month = 'Apr' THEN 4
      WHEN de.month = 'May' THEN 5
      WHEN de.month = 'Jun' THEN 6
      WHEN de.month = 'Jul' THEN 7
      WHEN de.month = 'Aug' THEN 8
      WHEN de.month = 'Sep' THEN 9
      WHEN de.month = 'Oct' THEN 10
      WHEN de.month = 'Nov' THEN 11
      WHEN de.month = 'Dec' THEN 12
      ELSE 99
    END`;
        const request = pool.request()
            .input('metricId', mssql_1.default.Int, parseInt(metricId));
        if (year) {
            request.input('year', mssql_1.default.Int, parseInt(year));
        }
        const result = await request.query(query);
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        logger_1.logger.error('Error fetching delivery entries:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch entries' });
    }
});
// Get delivery summary by sub-category
router.get('/summary', async (req, res) => {
    try {
        const { year } = req.query;
        const pool = await (0, database_1.getKpiDb)();
        const yearFilter = year ? `AND de.year = ${parseInt(year)}` : '';
        const result = await pool.request().query(`
      SELECT 
        sc.id as sub_category_id,
        sc.name_en as sub_category_name,
        sc.key as sub_category_key,
        COUNT(DISTINCT m.id) as metric_count,
        SUM(CASE WHEN de.result IS NOT NULL THEN 1 ELSE 0 END) as entries_with_data,
        SUM(CASE WHEN de.reason IS NOT NULL AND de.reason != '' THEN 1 ELSE 0 END) as entries_with_issues
      FROM delivery_sub_categories sc
      LEFT JOIN delivery_metrics m ON sc.id = m.sub_category_id
      LEFT JOIN delivery_data_entries de ON m.id = de.metric_id ${yearFilter}
      GROUP BY sc.id, sc.name_en, sc.key, sc.sort_order
      ORDER BY sc.sort_order
    `);
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        logger_1.logger.error('Error fetching delivery summary:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch summary' });
    }
});
// Get delivery data by month
router.get('/by-month', async (req, res) => {
    try {
        const { year, month } = req.query;
        if (!year || !month) {
            return res.status(400).json({ success: false, error: 'Year and month are required' });
        }
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request()
            .input('year', mssql_1.default.Int, parseInt(year))
            .input('month', mssql_1.default.NVarChar, month)
            .query(`
        SELECT 
          de.id,
          de.metric_id,
          m.no as metric_no,
          m.measurement,
          m.unit,
          m.main,
          m.main_relate,
          m.fy25_target,
          sc.name_en as sub_category_name,
          sc.key as sub_category_key,
          de.month,
          de.year,
          de.target,
          de.result,
          de.accu_target,
          de.accu_result,
          de.forecast,
          de.reason,
          de.recover_activity
        FROM delivery_data_entries de
        JOIN delivery_metrics m ON de.metric_id = m.id
        JOIN delivery_sub_categories sc ON m.sub_category_id = sc.id
        WHERE de.year = @year AND de.month = @month
        ORDER BY sc.sort_order, m.no
      `);
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        logger_1.logger.error('Error fetching delivery data by month:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch data' });
    }
});
// Get available years
router.get('/years', async (req, res) => {
    try {
        const pool = await (0, database_1.getKpiDb)();
        const result = await pool.request().query(`
      SELECT DISTINCT year 
      FROM delivery_data_entries 
      ORDER BY year DESC
    `);
        res.json({ success: true, data: result.recordset.map(r => r.year) });
    }
    catch (error) {
        logger_1.logger.error('Error fetching years:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch years' });
    }
});
// Update delivery data entry
router.put('/entries/:entryId', async (req, res) => {
    try {
        const { entryId } = req.params;
        const { target, result, accu_target, accu_result, forecast, reason, recover_activity } = req.body;
        const pool = await (0, database_1.getKpiDb)();
        await pool.request()
            .input('entryId', mssql_1.default.Int, parseInt(entryId))
            .input('target', mssql_1.default.Decimal(18, 2), target)
            .input('result', mssql_1.default.Decimal(18, 2), result)
            .input('accu_target', mssql_1.default.Decimal(18, 2), accu_target)
            .input('accu_result', mssql_1.default.Decimal(18, 2), accu_result)
            .input('forecast', mssql_1.default.Decimal(18, 2), forecast)
            .input('reason', mssql_1.default.NVarChar(mssql_1.default.MAX), reason)
            .input('recover_activity', mssql_1.default.NVarChar(mssql_1.default.MAX), recover_activity)
            .query(`
        UPDATE delivery_data_entries
        SET 
          target = @target,
          result = @result,
          accu_target = @accu_target,
          accu_result = @accu_result,
          forecast = @forecast,
          reason = @reason,
          recover_activity = @recover_activity,
          updated_at = GETDATE()
        WHERE id = @entryId
      `);
        res.json({ success: true, message: 'Entry updated successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error updating delivery entry:', error);
        res.status(500).json({ success: false, error: 'Failed to update entry' });
    }
});
// Get delivery products with entries
router.get('/products', async (req, res) => {
    try {
        const { metricId, year, month } = req.query;
        const pool = await (0, database_1.getKpiDb)();
        let query = `
      SELECT 
        p.id,
        p.name,
        p.key,
        p.sort_order,
        pe.month,
        pe.year,
        pe.target,
        pe.result
      FROM delivery_products p
      LEFT JOIN delivery_product_entries pe ON p.id = pe.product_id
    `;
        const conditions = [];
        const request = pool.request();
        if (metricId) {
            conditions.push('pe.metric_id = @metricId');
            request.input('metricId', mssql_1.default.Int, parseInt(metricId));
        }
        if (year) {
            conditions.push('pe.year = @year');
            request.input('year', mssql_1.default.Int, parseInt(year));
        }
        if (month) {
            conditions.push('pe.month = @month');
            request.input('month', mssql_1.default.NVarChar, month);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY p.sort_order';
        const result = await request.query(query);
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        logger_1.logger.error('Error fetching delivery products:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch products' });
    }
});
exports.default = router;
