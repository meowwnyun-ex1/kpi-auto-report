import { Router, Request, Response } from 'express';
import { getKpiDb } from '../config/database';
import sql from 'mssql';

const router = Router();

// ============================================
// QUALITY KPI ENDPOINTS
// ============================================

/**
 * Get Quality KPI summary for dashboard
 */
router.get('/quality/summary', async (req: Request, res: Response) => {
  try {
    const pool = await getKpiDb();

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
        sc.name_en as sub_category,
        sc.[key] as sub_category_key,
        latest.target,
        latest.result,
        latest.accu_target,
        latest.accu_result,
        latest.month,
        latest.year
      FROM quality_metrics m
      INNER JOIN quality_sub_categories sc ON m.sub_category_id = sc.id
      OUTER APPLY (
        SELECT TOP 1 
          CAST(de.target AS FLOAT) as target,
          CAST(de.result AS FLOAT) as result,
          CAST(de.accu_target AS FLOAT) as accu_target,
          CAST(de.accu_result AS FLOAT) as accu_result,
          de.month,
          de.year
        FROM quality_data_entries de
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

    const summary = {
      total_metrics: metrics.length,
      claim_metrics: metrics.filter((m: any) => m.sub_category_key === 'claim').length,
      loss_metrics: metrics.filter((m: any) => m.sub_category_key === 'loss').length,
      metrics: metrics.map((m: any) => ({
        id: m.id,
        no: m.no,
        measurement: m.measurement,
        unit: m.unit,
        main: m.main,
        main_relate: m.main_relate,
        fy25_target: m.fy25_target,
        sub_category: m.sub_category,
        sub_category_key: m.sub_category_key,
        latest_entry: m.target
          ? {
              target: m.target,
              result: m.result,
              accu_target: m.accu_target,
              accu_result: m.accu_result,
              month: m.month,
              year: m.year,
            }
          : null,
      })),
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching Quality KPI summary:', error);
    res.status(500).json({ error: 'Failed to fetch Quality KPI summary' });
  }
});

/**
 * Get Quality KPI data entries by metric ID
 */
router.get('/quality/metrics/:metricId/entries', async (req: Request, res: Response) => {
  try {
    const metricId = Array.isArray(req.params.metricId)
      ? req.params.metricId[0]
      : req.params.metricId;
    const pool = await getKpiDb();

    const result = await pool.request().input('metricId', sql.Int, parseInt(metricId)).query(`
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
        FROM quality_data_entries de
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
  } catch (error) {
    console.error('Error fetching Quality KPI entries:', error);
    res.status(500).json({ error: 'Failed to fetch Quality KPI entries' });
  }
});

/**
 * Get Quality KPI trend data for charts
 */
router.get('/quality/trend', async (req: Request, res: Response) => {
  try {
    const { metricId, year } = req.query;
    const pool = await getKpiDb();

    let query = `
      SELECT 
        m.id as metric_id,
        m.no,
        m.measurement,
        m.unit,
        m.fy25_target,
        de.month,
        de.year,
        TRY_CAST(de.target AS FLOAT) as target,
        TRY_CAST(de.result AS FLOAT) as result,
        TRY_CAST(de.accu_target AS FLOAT) as accu_target,
        TRY_CAST(de.accu_result AS FLOAT) as accu_result
      FROM quality_metrics m
      LEFT JOIN quality_data_entries de ON m.id = de.metric_id
    `;

    const conditions: string[] = [];

    if (metricId) {
      conditions.push('m.id = @metricId');
    }
    if (year) {
      conditions.push('de.year = @year');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      ORDER BY m.no, de.year,
        CASE de.month
          WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
          WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
          WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
          WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END
    `;

    const request = pool.request();
    if (metricId) {
      request.input('metricId', sql.Int, parseInt(metricId as string));
    }
    if (year) {
      request.input('year', sql.Int, parseInt(year as string));
    }

    const result = await request.query(query);

    // Group data by metric for chart display
    const trendData: Record<number, any> = {};

    result.recordset.forEach((row: any) => {
      if (!trendData[row.metric_id]) {
        trendData[row.metric_id] = {
          metric_id: row.metric_id,
          no: row.no,
          measurement: row.measurement,
          unit: row.unit,
          fy25_target: row.fy25_target,
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
  } catch (error) {
    console.error('Error fetching Quality KPI trend:', error);
    res.status(500).json({ error: 'Failed to fetch Quality KPI trend' });
  }
});

/**
 * Get Quality KPI product breakdown
 */
router.get('/quality/products', async (req: Request, res: Response) => {
  try {
    const { metricId, month, year } = req.query;
    const pool = await getKpiDb();

    let query = `
      SELECT 
        pe.id,
        pe.metric_id,
        pe.month,
        pe.year,
        p.[key] as product_key,
        p.name_en as product_name,
        TRY_CAST(pe.value AS FLOAT) as value
      FROM quality_product_entries pe
      INNER JOIN quality_products p ON pe.product_id = p.id
    `;

    const conditions: string[] = [];

    if (metricId) {
      conditions.push('pe.metric_id = @metricId');
    }
    if (month) {
      conditions.push('pe.month = @month');
    }
    if (year) {
      conditions.push('pe.year = @year');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.sort_order';

    const request = pool.request();
    if (metricId) {
      request.input('metricId', sql.Int, parseInt(metricId as string));
    }
    if (month) {
      request.input('month', sql.NVarChar, month as string);
    }
    if (year) {
      request.input('year', sql.Int, parseInt(year as string));
    }

    const result = await request.query(query);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching Quality KPI products:', error);
    res.status(500).json({ error: 'Failed to fetch Quality KPI products' });
  }
});

/**
 * Get Quality KPI comparison chart data
 */
router.get('/quality/comparison', async (req: Request, res: Response) => {
  try {
    const { year, subCategory } = req.query;
    const pool = await getKpiDb();

    const result = await pool
      .request()
      .input('year', sql.Int, year ? parseInt(year as string) : 2025)
      .input('subCategory', sql.NVarChar, (subCategory as string) || 'claim').query(`
        WITH MonthlyData AS (
          SELECT 
            m.id as metric_id,
            m.no,
            m.measurement,
            m.unit,
            m.fy25_target,
            sc.[key] as sub_category_key,
            de.month,
            de.year,
            TRY_CAST(de.accu_result AS FLOAT) as accu_result,
            TRY_CAST(de.accu_target AS FLOAT) as accu_target
          FROM quality_metrics m
          INNER JOIN quality_sub_categories sc ON m.sub_category_id = sc.id
          LEFT JOIN quality_data_entries de ON m.id = de.metric_id AND de.year = @year
          WHERE sc.[key] = @subCategory
        )
        SELECT 
          metric_id,
          no,
          measurement,
          unit,
          fy25_target,
          sub_category_key,
          month,
          year,
          accu_result,
          accu_target,
          CASE 
            WHEN accu_target > 0 AND accu_result IS NOT NULL 
            THEN (accu_result / accu_target) * 100 
            ELSE NULL 
          END as achievement_percentage
        FROM MonthlyData
        WHERE month IS NOT NULL
        ORDER BY no,
          CASE month
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
          END
      `);

    // Group by metric for chart
    const comparisonData: Record<number, any> = {};

    result.recordset.forEach((row: any) => {
      if (!comparisonData[row.metric_id]) {
        comparisonData[row.metric_id] = {
          metric_id: row.metric_id,
          no: row.no,
          measurement: row.measurement,
          unit: row.unit,
          fy25_target: row.fy25_target,
          sub_category_key: row.sub_category_key,
          monthly_data: [],
        };
      }

      comparisonData[row.metric_id].monthly_data.push({
        month: row.month,
        year: row.year,
        accu_result: row.accu_result,
        accu_target: row.accu_target,
        achievement_percentage: row.achievement_percentage,
      });
    });

    res.json(Object.values(comparisonData));
  } catch (error) {
    console.error('Error fetching Quality KPI comparison:', error);
    res.status(500).json({ error: 'Failed to fetch Quality KPI comparison' });
  }
});

/**
 * Get Quality KPI dashboard overview
 */
router.get('/quality/dashboard', async (req: Request, res: Response) => {
  try {
    const pool = await getKpiDb();

    // Get overall statistics
    const statsResult = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM quality_metrics WHERE is_active = 1) as total_metrics,
        (SELECT COUNT(*) FROM quality_data_entries) as total_entries,
        (SELECT COUNT(*) FROM quality_products WHERE is_active = 1) as total_products,
        (SELECT COUNT(DISTINCT year) FROM quality_data_entries) as years_covered
    `);

    // Get claim metrics summary
    const claimResult = await pool.request().query(`
      SELECT 
        m.no,
        m.measurement,
        m.fy25_target,
        (
          SELECT TOP 1 de.accu_result 
          FROM quality_data_entries de 
          WHERE de.metric_id = m.id 
          ORDER BY de.year DESC, 
            CASE de.month
              WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
              WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
              WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
              WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
            END DESC
        ) as latest_accu_result
      FROM quality_metrics m
      INNER JOIN quality_sub_categories sc ON m.sub_category_id = sc.id
      WHERE sc.[key] = 'claim' AND m.is_active = 1
      ORDER BY m.no
    `);

    // Get loss metrics summary
    const lossResult = await pool.request().query(`
      SELECT 
        m.no,
        m.measurement,
        m.unit,
        m.fy25_target,
        (
          SELECT TOP 1 de.accu_result 
          FROM quality_data_entries de 
          WHERE de.metric_id = m.id 
          ORDER BY de.year DESC, 
            CASE de.month
              WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
              WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
              WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
              WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
            END DESC
        ) as latest_accu_result
      FROM quality_metrics m
      INNER JOIN quality_sub_categories sc ON m.sub_category_id = sc.id
      WHERE sc.[key] = 'loss' AND m.is_active = 1
      ORDER BY m.no
    `);

    // Get monthly trend for Cost of spoilage (MB)
    const trendResult = await pool.request().query(`
      SELECT 
        de.month,
        de.year,
        TRY_CAST(de.target AS FLOAT) as target,
        TRY_CAST(de.result AS FLOAT) as result,
        TRY_CAST(de.accu_target AS FLOAT) as accu_target,
        TRY_CAST(de.accu_result AS FLOAT) as accu_result
      FROM quality_data_entries de
      INNER JOIN quality_metrics m ON de.metric_id = m.id
      WHERE m.no = 9 AND m.measurement = 'Cost of spoilage' AND m.unit = 'MB'
      ORDER BY de.year,
        CASE de.month
          WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
          WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
          WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
          WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END
    `);

    const dashboard = {
      stats: statsResult.recordset[0],
      claim_metrics: claimResult.recordset,
      loss_metrics: lossResult.recordset,
      cost_of_spoilage_trend: trendResult.recordset,
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching Quality KPI dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch Quality KPI dashboard' });
  }
});

export default router;
