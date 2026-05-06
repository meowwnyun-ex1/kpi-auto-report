import express from 'express';
import sql from 'mssql';
import { getKpiDb, getSpoDb } from '../config/database';
import { logger } from '../utils/logger';
import { allowGuest } from '../middleware/auth';
import { loadDeptMap } from './kpi-yearly';

const router = express.Router();
router.use(allowGuest);

/**
 * GET /api/kpi-forms/overview/:fiscal_year/:month
 */
router.get('/overview/:fiscal_year/:month', async (req, res) => {
  try {
    const { fiscal_year, month } = req.params;
    const { company, category } = req.query;
    const pool = await getKpiDb();
    let spoPool: any = null;
    try {
      spoPool = await getSpoDb();
    } catch {
      /* optional */
    }
    const deptMap = await loadDeptMap(spoPool);

    const user = (req as any).user;
    const userRole = user?.role;
    const userDept = user?.department_id;

    const request = pool
      .request()
      .input('fiscal_year', sql.Int, parseInt(fiscal_year))
      .input('month', sql.TinyInt, parseInt(month));

    let deptFilter = '';
    if (userRole === 'manager' && userDept) {
      deptFilter = ` AND (me.department_id = @userDept OR me.main_relate LIKE '%'+@userDept+'%')`;
      request.input('userDept', sql.NVarChar, userDept);
    }

    let categoryFilter = '';
    if (category && category !== 'all') {
      categoryFilter = ` AND kc.[key] = @category`;
      request.input('category', sql.NVarChar, category as string);
    }

    // Load KPI dept mapping for name resolution
    let kpiDeptMap = new Map<string, any>();
    try {
      const r = await pool
        .request()
        .query(`SELECT kpi_code, description FROM kpi_department_mapping`);
      for (const row of r.recordset) kpiDeptMap.set(row.kpi_code, row);
    } catch {
      /* optional */
    }

    const statusResult = await request.query(`
      SELECT
        me.department_id,
        me.category_id,
        kc.name       as category_name,
        kc.[key]      as category_key,
        COUNT(*)      as total_measurements,
        SUM(CASE WHEN me.result IS NOT NULL THEN 1 ELSE 0 END) as filled_measurements,
        SUM(CASE WHEN me.result IS NULL     THEN 1 ELSE 0 END) as missing_measurements,
        CASE
          WHEN SUM(CASE WHEN me.result IS NULL THEN 1 ELSE 0 END) = 0 THEN 'complete'
          WHEN SUM(CASE WHEN me.result IS NOT NULL THEN 1 ELSE 0 END) = 0 THEN 'missing'
          ELSE 'partial'
        END as status,
        AVG(CASE
          WHEN me.result IS NOT NULL AND me.target IS NOT NULL AND me.target > 0
          THEN (me.result * 100.0 / me.target) ELSE NULL
        END) as achievement_rate
      FROM kpi_monthly_targets me
      LEFT JOIN kpi_categories kc ON me.category_id = kc.id
      WHERE me.fiscal_year = @fiscal_year AND me.month = @month
        ${categoryFilter}
        ${deptFilter}
      GROUP BY me.department_id, me.category_id, kc.name, kc.[key]
      ORDER BY me.department_id, kc.name
    `);

    const status = statusResult.recordset.map((s: any) => {
      const kpiDept = kpiDeptMap.get(s.department_id);
      const spoDept = deptMap.get(s.department_id);
      const name = kpiDept?.description || spoDept?.name_en || s.department_id;
      const company = spoDept?.company || '';
      return { ...s, department_name: name, company };
    });

    // Fetch detailed KPI data for the table
    const detailsRequest = pool
      .request()
      .input('fiscal_year', sql.Int, parseInt(fiscal_year))
      .input('month', sql.TinyInt, parseInt(month));

    let detailsDeptFilter = '';
    if (userRole === 'manager' && userDept) {
      detailsDeptFilter = ` AND (me.department_id = @userDept OR me.main_relate LIKE '%'+@userDept+'%')`;
      detailsRequest.input('userDept', sql.NVarChar, userDept);
    }

    let detailsCategoryFilter = '';
    if (category && category !== 'all') {
      detailsCategoryFilter = ` AND kc.[key] = @category`;
      detailsRequest.input('category', sql.NVarChar, category as string);
    }

    const detailsResult = await detailsRequest.query(`
      SELECT
        me.id,
        me.department_id,
        me.category_id,
        me.fiscal_year,
        me.month,
        me.target,
        me.result,
        me.accu_target,
        me.accu_result,
        me.ev,
        kc.name as category_name,
        kc.[key] as category_key,
        mm.measurement,
        mm.unit,
        mm.main,
        yt.fy_target
      FROM kpi_monthly_targets me
      LEFT JOIN kpi_categories kc ON me.category_id = kc.id
      LEFT JOIN kpi_yearly_targets yt ON yt.id = me.yearly_target_id
      LEFT JOIN kpi_measurements mm ON yt.measurement_id = mm.id
      WHERE me.fiscal_year = @fiscal_year AND me.month = @month
        ${detailsCategoryFilter}
        ${detailsDeptFilter}
      ORDER BY me.department_id, kc.name, yt.id
    `);

    const details = detailsResult.recordset.map((d: any) => {
      const kpiDept = kpiDeptMap.get(d.department_id);
      const spoDept = deptMap.get(d.department_id);
      const name = kpiDept?.description || spoDept?.name_en || d.department_id;
      return { ...d, department_name: name };
    });

    res.json({ success: true, data: { status, details } });
  } catch (error) {
    logger.error('Error fetching KPI overview', error);
    res.status(500).json({ success: false, message: 'Failed to fetch overview' });
  }
});

/**
 * GET /api/kpi-forms/timeline/:fiscal_year/:month  (Gantt timeline per month)
 */
router.get('/timeline/:fiscal_year/:month', async (req, res) => {
  try {
    const { fiscal_year, month } = req.params;
    const { company } = req.query;
    const pool = await getKpiDb();
    let spoPool: any = null;
    try {
      spoPool = await getSpoDb();
    } catch {
      /* optional */
    }
    const deptMap = await loadDeptMap(spoPool);

    let query = `
      SELECT
        me.id, me.department_id, me.category_id,
        me.fiscal_year, me.month,
        me.target, me.result, me.accu_target, me.accu_result,
        me.ev as judge,
        CASE
          WHEN me.result IS NOT NULL AND me.target IS NOT NULL AND me.result >= me.target THEN 'achieved'
          WHEN me.result IS NOT NULL AND me.target IS NOT NULL AND me.result < me.target  THEN 'not_achieved'
          ELSE 'pending'
        END as status,
        kc.name as category_name, kc.[key] as category_key,
        mm.measurement, mm.unit, mm.main, yt.fy_target
      FROM kpi_monthly_targets me
      LEFT JOIN kpi_categories kc ON me.category_id = kc.id
      LEFT JOIN kpi_yearly_targets yt ON yt.id = me.yearly_target_id
      LEFT JOIN kpi_measurements mm ON yt.measurement_id = mm.id
      WHERE me.fiscal_year = @fiscal_year AND me.month = @month
    `;

    const request = pool
      .request()
      .input('fiscal_year', sql.Int, parseInt(fiscal_year))
      .input('month', sql.TinyInt, parseInt(month));

    if (company && company !== 'all') {
      const ids = Array.from(deptMap.values())
        .filter((d: any) => d.company === company)
        .map((d: any) => `'${d.dept_id}'`)
        .join(',');
      if (ids) query += ` AND me.department_id IN (${ids})`;
    }
    query += ` ORDER BY me.department_id, kc.sort_order, yt.id`;

    const result = await request.query(query);
    const data = result.recordset.map((r: any) => {
      const dept = deptMap.get(r.department_id) || { name_en: r.department_id, company: '' };
      return { ...r, department_name: dept.name_en, company: dept.company };
    });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching timeline data', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timeline data' });
  }
});

/**
 * GET /api/kpi-forms/timeline  (recent activity log)
 */
router.get('/timeline', async (req, res) => {
  try {
    const { year, company, limit = 20 } = req.query;
    const pool = await getKpiDb();
    let spoPool: any = null;
    try {
      spoPool = await getSpoDb();
    } catch {
      /* optional */
    }
    const deptMap = await loadDeptMap(spoPool);

    let yearFilterMonthly = 'WHERE me.result IS NOT NULL';
    let yearFilterYearly = 'WHERE yt.fy_target IS NOT NULL';
    let yearFilterAP = 'WHERE ap.key_action IS NOT NULL';
    const request = pool.request();

    if (year) {
      yearFilterMonthly += ' AND me.fiscal_year = @year';
      yearFilterYearly += ' AND yt.fiscal_year = @year';
      yearFilterAP += ' AND ap.fiscal_year = @year';
      request.input('year', sql.Int, parseInt(year as string));
    }

    let query = `
      SELECT * FROM (
        SELECT
          me.id,
          'entry_updated' as type,
          me.department_id,
          kc.name as category_name,
          mm.measurement,
          CASE me.month
            WHEN 1 THEN 'Jan' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar' WHEN 4 THEN 'Apr'
            WHEN 5 THEN 'May' WHEN 6 THEN 'Jun' WHEN 7 THEN 'Jul' WHEN 8 THEN 'Aug'
            WHEN 9 THEN 'Sep' WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dec'
          END as month_name,
          me.updated_at as timestamp
        FROM kpi_monthly_targets me
        LEFT JOIN kpi_categories kc ON me.category_id = kc.id
        LEFT JOIN kpi_yearly_targets yt ON yt.id = me.yearly_target_id
        LEFT JOIN kpi_measurements mm ON yt.measurement_id = mm.id
        ${yearFilterMonthly}

        UNION ALL

        SELECT
          yt.id,
          'target_set' as type,
          yt.department_id,
          kc.name as category_name,
          mm.measurement,
          NULL as month_name,
          yt.updated_at as timestamp
        FROM kpi_yearly_targets yt
        LEFT JOIN kpi_categories kc ON yt.category_id = kc.id
        LEFT JOIN kpi_measurements mm ON yt.measurement_id = mm.id
        ${yearFilterYearly}

        UNION ALL

        SELECT
          ap.id,
          'action_plan' as type,
          ap.department_id,
          kc.name as category_name,
          ap.key_action as measurement,
          NULL as month_name,
          ap.updated_at as timestamp
        FROM kpi_action_plans ap
        LEFT JOIN kpi_yearly_targets yt ON yt.id = ap.yearly_target_id
        LEFT JOIN kpi_categories kc ON yt.category_id = kc.id
        ${yearFilterAP}
      ) AS tl WHERE 1=1
    `;

    if (company && company !== 'all') {
      const ids = Array.from(deptMap.values())
        .filter((d: any) => d.company === company)
        .map((d: any) => `'${d.dept_id}'`)
        .join(',');
      if (ids) query += ` AND department_id IN (${ids})`;
    }

    query += ` ORDER BY timestamp DESC OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY`;
    request.input('limit', sql.Int, parseInt(limit as string));

    const result = await request.query(query);
    const data = result.recordset.map((r: any) => {
      const dept = deptMap.get(r.department_id) || { name_en: r.department_id, company: '' };
      return { ...r, department_name: dept.name_en, company: dept.company };
    });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching timeline', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timeline' });
  }
});

export default router;
