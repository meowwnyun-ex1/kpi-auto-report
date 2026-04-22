import express from 'express';
import sql from 'mssql';
import { getKpiDb, getSpoDb } from '../config/database';
import { logger } from '../utils/logger';
import { allowGuest, requireManager } from '../middleware/auth';

const router = express.Router();
router.use(allowGuest);

// ── Helper: resolve department name from KPI mapping or SPO_Dev ──────────────
async function resolveDeptName(
  pool: sql.ConnectionPool,
  deptId: string,
  spoPool: any | null
): Promise<string> {
  try {
    const mapping = await pool
      .request()
      .input('kpi_code', sql.NVarChar, deptId)
      .query(`SELECT description FROM kpi_department_mapping WHERE kpi_code = @kpi_code`);
    if (mapping.recordset.length > 0 && mapping.recordset[0].description) {
      return mapping.recordset[0].description;
    }
  } catch {
    /* ignore */
  }
  if (spoPool) {
    try {
      const r = await spoPool
        .request()
        .input('dept_id', sql.NVarChar, deptId)
        .query(`SELECT Section_name as name_en FROM dept_master WHERE ID = @dept_id`);
      if (r.recordset[0]?.name_en) return r.recordset[0].name_en;
    } catch {
      /* ignore */
    }
  }
  return deptId;
}

// ── Helper: load SPO dept map safely ─────────────────────────────────────────
export async function loadDeptMap(spoPool: any | null): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  if (!spoPool) return map;
  try {
    const r = await spoPool
      .request()
      .query(
        `SELECT ID as dept_id, Section_name as name_en, Company as company FROM dept_master WHERE is_active = 'Active'`
      );
    for (const d of r.recordset) map.set(d.dept_id, d);
  } catch {
    /* ignore */
  }
  return map;
}

// ── Helper: convert comma-separated dept codes to names ─────────────────────
function resolveDeptIds(raw: string | null | undefined, deptMap: Map<string, any>): string {
  if (!raw) return '';
  return raw
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((code) => deptMap.get(code)?.name_en || code)
    .join(', ');
}

/**
 * GET /api/kpi-forms/yearly/:department_id/:fiscal_year
 */
router.get('/yearly/:department_id/:fiscal_year', async (req, res) => {
  try {
    const { department_id, fiscal_year } = req.params;
    const { category } = req.query;
    const pool = await getKpiDb();
    let spoPool: any = null;
    try {
      spoPool = await getSpoDb();
    } catch {
      /* optional */
    }

    const user = (req as any).user;
    if (user?.role === 'manager' && user?.department_id && department_id !== user.department_id) {
      const check = await pool
        .request()
        .input('userDept', sql.NVarChar, user.department_id)
        .input('targetDept', sql.NVarChar, department_id)
        .query(
          `SELECT COUNT(*) as cnt FROM kpi_yearly_targets WHERE department_id = @targetDept AND main_relate LIKE '%' + @userDept + '%'`
        );
      if (check.recordset[0].cnt === 0) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const deptName = await resolveDeptName(pool, department_id, spoPool);

    const request = pool
      .request()
      .input('department_id', sql.NVarChar, department_id)
      .input('fiscal_year', sql.Int, parseInt(fiscal_year));

    let categoryFilter = '';
    if (category && category !== 'all') {
      categoryFilter = `AND kc.[key] = @category`;
      request.input('category', sql.NVarChar, String(category));
    }

    const result = await request.query(`
      SELECT
        yt.id, yt.department_id, yt.category_id, yt.metric_id,
        yt.fiscal_year, yt.company_policy, yt.department_policy,
        yt.key_actions, yt.remaining_kadai, yt.environment_changes,
        yt.fy_target, yt.fy_target_text, yt.main_pic, yt.main_support,
        yt.support_sdm, yt.support_skd,
        yt.president_approved, yt.vp_approved, yt.dept_head_approved,
        ISNULL(yt.total_quota, 0) as total_target,
        ISNULL(yt.used_quota, 0) as used_quota,
        ISNULL(yt.total_quota, 0) - ISNULL(yt.used_quota, 0) as remaining_quota,
        yt.dept_quota as dept_target, yt.target_type, yt.main_relate,
        yt.metric_no, yt.measurement, yt.unit, yt.main, yt.description_of_target,
        kc.name as category_name, kc.[key] as category_key
      FROM kpi_yearly_targets yt
      LEFT JOIN kpi_categories kc ON yt.category_id = kc.id
      WHERE (yt.department_id = @department_id OR yt.main_relate LIKE '%' + @department_id + '%')
        AND yt.fiscal_year = @fiscal_year
        ${categoryFilter}
      ORDER BY kc.sort_order, yt.metric_no
    `);

    // Resolve main_relate codes → dept names
    const deptMap = await loadDeptMap(spoPool);
    const data = result.recordset.map((r: any) => ({
      ...r,
      department_name: deptName,
      main_relate_display: resolveDeptIds(r.main_relate, deptMap),
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Error fetching yearly targets', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yearly targets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * PUT /api/kpi-forms/yearly/:id/quota
 */
router.put('/yearly/:id/quota', requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { total_quota, description_of_target } = req.body;
    if (total_quota === undefined || total_quota === null) {
      return res.status(400).json({ success: false, message: 'total_quota is required' });
    }
    const pool = await getKpiDb();
    await pool
      .request()
      .input('id', sql.Int, Number(id))
      .input('total_quota', sql.Decimal(18, 4), parseFloat(String(total_quota)))
      .input('description_of_target', sql.NVarChar(sql.MAX), description_of_target ?? null).query(`
        UPDATE kpi_yearly_targets
        SET total_quota = @total_quota,
            description_of_target = @description_of_target,
            updated_at = GETDATE()
        WHERE id = @id
      `);
    res.json({ success: true, message: 'Pool updated' });
  } catch (error) {
    logger.error('Error updating yearly quota', error);
    res.status(500).json({ success: false, message: 'Failed to update pool' });
  }
});

/**
 * POST /api/kpi-forms/yearly  (single upsert)
 */
router.post('/yearly', requireManager, async (req, res) => {
  try {
    const {
      department_id,
      category_id,
      metric_id,
      fiscal_year,
      company_policy,
      department_policy,
      key_actions,
      remaining_kadai,
      environment_changes,
      fy_target,
      fy_target_text,
      main_pic,
      main_support,
      support_sdm,
      support_skd,
    } = req.body;
    const pool = await getKpiDb();
    const userId = (req as any).user?.id;

    const result = await pool
      .request()
      .input('department_id', sql.NVarChar, department_id)
      .input('category_id', sql.Int, category_id)
      .input('metric_id', sql.Int, metric_id || null)
      .input('fiscal_year', sql.Int, fiscal_year)
      .input('company_policy', sql.NVarChar(sql.MAX), company_policy)
      .input('department_policy', sql.NVarChar(sql.MAX), department_policy)
      .input('key_actions', sql.NVarChar(sql.MAX), key_actions)
      .input('remaining_kadai', sql.NVarChar(sql.MAX), remaining_kadai)
      .input('environment_changes', sql.NVarChar(sql.MAX), environment_changes)
      .input('fy_target', sql.Decimal(18, 4), fy_target)
      .input('fy_target_text', sql.NVarChar(100), fy_target_text)
      .input('main_pic', sql.NVarChar(100), main_pic)
      .input('main_support', sql.NVarChar(255), main_support)
      .input('support_sdm', sql.NVarChar(255), support_sdm)
      .input('support_skd', sql.NVarChar(255), support_skd)
      .input('created_by', sql.Int, userId).query(`
        MERGE INTO kpi_yearly_targets AS target
        USING (SELECT @department_id as department_id, @category_id as category_id,
                      @metric_id as metric_id, @fiscal_year as fiscal_year) AS source
        ON target.department_id = source.department_id AND target.category_id = source.category_id
           AND ISNULL(target.metric_id, 0) = ISNULL(source.metric_id, 0)
           AND target.fiscal_year = source.fiscal_year
        WHEN MATCHED THEN
          UPDATE SET company_policy=@company_policy, department_policy=@department_policy,
            key_actions=@key_actions, remaining_kadai=@remaining_kadai, environment_changes=@environment_changes,
            fy_target=@fy_target, fy_target_text=@fy_target_text, main_pic=@main_pic,
            main_support=@main_support, support_sdm=@support_sdm, support_skd=@support_skd, updated_at=GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (department_id,category_id,metric_id,fiscal_year,company_policy,department_policy,key_actions,
                  remaining_kadai,environment_changes,fy_target,fy_target_text,main_pic,main_support,support_sdm,support_skd,created_by)
          VALUES (@department_id,@category_id,@metric_id,@fiscal_year,@company_policy,@department_policy,@key_actions,
                  @remaining_kadai,@environment_changes,@fy_target,@fy_target_text,@main_pic,@main_support,@support_sdm,@support_skd,@created_by)
        OUTPUT INSERTED.id;
      `);

    res.json({
      success: true,
      message: 'Yearly target saved',
      data: { id: result.recordset[0]?.id },
    });
  } catch (error) {
    logger.error('Error saving yearly target', error);
    res.status(500).json({ success: false, message: 'Failed to save yearly target' });
  }
});

/**
 * POST /api/kpi-forms/yearly/measurement
 * Create new KPI measurement (simplified version for AddTargetModal)
 */
router.post('/yearly/measurement', requireManager, async (req, res) => {
  try {
    const {
      category_id,
      measurement,
      unit,
      main,
      fy_target,
      total_target,
      description_of_target,
      main_relate,
    } = req.body;

    const pool = await getKpiDb();
    const userId = (req as any).user?.id;

    // Get metric_id from kpi_measurements table or create new one
    let metricId: number;
    const existingMetric = await pool
      .request()
      .input('category_id', sql.Int, category_id)
      .input('measurement', sql.NVarChar, measurement).query(`
        SELECT id FROM kpi_measurements 
        WHERE category_id = @category_id AND measurement = @measurement
      `);

    if (existingMetric.recordset.length > 0) {
      metricId = existingMetric.recordset[0].id;
    } else {
      // Create new measurement
      const newMetric = await pool
        .request()
        .input('category_id', sql.Int, category_id)
        .input('measurement', sql.NVarChar, measurement)
        .input('unit', sql.NVarChar, unit || null)
        .input('created_by', sql.Int, userId).query(`
          INSERT INTO kpi_measurements (category_id, measurement, unit, created_by)
          OUTPUT INSERTED.id
          VALUES (@category_id, @measurement, @unit, @created_by)
        `);
      metricId = newMetric.recordset[0].id;
    }

    // Create yearly target
    const result = await pool
      .request()
      .input('category_id', sql.Int, category_id)
      .input('metric_id', sql.Int, metricId)
      .input('measurement', sql.NVarChar, measurement)
      .input('unit', sql.NVarChar, unit || null)
      .input('main', sql.NVarChar, main || null)
      .input('fy_target', sql.Decimal(18, 4), fy_target || null)
      .input('total_target', sql.Decimal(18, 4), total_target)
      .input('description_of_target', sql.NVarChar(sql.MAX), description_of_target || null)
      .input('main_relate', sql.NVarChar, main_relate || null)
      .input('created_by', sql.Int, userId).query(`
        INSERT INTO kpi_yearly_targets (
          category_id, metric_id, measurement, unit, main, fy_target,
          total_target, description_of_target, main_relate, created_by
        )
        OUTPUT INSERTED.id, INSERTED.*
        VALUES (
          @category_id, @metric_id, @measurement, @unit, @main, @fy_target,
          @total_target, @description_of_target, @main_relate, @created_by
        )
      `);

    res.json({
      success: true,
      data: result.recordset[0],
      message: 'KPI measurement created successfully',
    });
  } catch (error: any) {
    logger.error('Error creating KPI measurement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create KPI measurement',
    });
  }
});

/**
 * POST /api/kpi-forms/yearly/batch
 */
router.post('/yearly/batch', requireManager, async (req, res) => {
  try {
    const { targets } = req.body;
    if (!Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ success: false, message: 'No targets provided' });
    }
    const pool = await getKpiDb();
    const userId = (req as any).user?.id;
    const transaction = pool.transaction();
    const results: any[] = [];

    try {
      await transaction.begin();
      for (const t of targets) {
        const r = await transaction
          .request()
          .input('department_id', sql.NVarChar, t.department_id)
          .input('category_id', sql.Int, t.category_id)
          .input('metric_id', sql.Int, t.metric_id || null)
          .input('fiscal_year', sql.Int, t.fiscal_year)
          .input('company_policy', sql.NVarChar(sql.MAX), t.company_policy || '')
          .input('department_policy', sql.NVarChar(sql.MAX), t.department_policy || '')
          .input('key_actions', sql.NVarChar(sql.MAX), t.key_actions || '')
          .input('remaining_kadai', sql.NVarChar(sql.MAX), t.remaining_kadai || '')
          .input('environment_changes', sql.NVarChar(sql.MAX), t.environment_changes || '')
          .input('fy_target', sql.Decimal(18, 4), t.fy_target || null)
          .input('fy_target_text', sql.NVarChar(100), t.fy_target_text || '')
          .input('main_pic', sql.NVarChar(100), t.main_pic || '')
          .input('main_support', sql.NVarChar(255), t.main_support || '')
          .input('support_sdm', sql.NVarChar(255), t.support_sdm || '')
          .input('support_skd', sql.NVarChar(255), t.support_skd || '')
          .input('total_quota', sql.Decimal(18, 4), t.total_quota || null)
          .input('dept_quota', sql.Decimal(18, 4), t.dept_quota || null)
          .input('target_type', sql.NVarChar(20), t.target_type || null)
          .input('metric_no', sql.NVarChar(20), t.metric_no || null)
          .input('measurement', sql.NVarChar(500), t.measurement || null)
          .input('unit', sql.NVarChar(50), t.unit || null)
          .input('main', sql.NVarChar(50), t.main || null)
          .input('main_relate', sql.NVarChar(255), t.main_relate || null)
          .input('description_of_target', sql.NVarChar(sql.MAX), t.description_of_target || null)
          .input('created_by', sql.Int, userId).query(`
            MERGE INTO kpi_yearly_targets AS target
            USING (SELECT @department_id as department_id, @category_id as category_id,
                          @metric_id as metric_id, @fiscal_year as fiscal_year) AS source
            ON target.department_id = source.department_id AND target.category_id = source.category_id
               AND ISNULL(target.metric_id, 0) = ISNULL(source.metric_id, 0)
               AND target.fiscal_year = source.fiscal_year
            WHEN MATCHED THEN
              UPDATE SET company_policy=@company_policy,department_policy=@department_policy,
                key_actions=@key_actions,remaining_kadai=@remaining_kadai,environment_changes=@environment_changes,
                fy_target=@fy_target,fy_target_text=@fy_target_text,main_pic=@main_pic,
                main_support=@main_support,support_sdm=@support_sdm,support_skd=@support_skd,
                total_quota=@total_quota,dept_quota=@dept_quota,target_type=@target_type,
                metric_no=@metric_no,measurement=@measurement,unit=@unit,main=@main,
                main_relate=@main_relate,description_of_target=@description_of_target,updated_at=GETDATE()
            WHEN NOT MATCHED THEN
              INSERT (department_id,category_id,metric_id,fiscal_year,company_policy,department_policy,key_actions,
                      remaining_kadai,environment_changes,fy_target,fy_target_text,main_pic,main_support,support_sdm,support_skd,
                      total_quota,dept_quota,target_type,metric_no,measurement,unit,main,main_relate,description_of_target,created_by)
              VALUES (@department_id,@category_id,@metric_id,@fiscal_year,@company_policy,@department_policy,@key_actions,
                      @remaining_kadai,@environment_changes,@fy_target,@fy_target_text,@main_pic,@main_support,@support_sdm,@support_skd,
                      @total_quota,@dept_quota,@target_type,@metric_no,@measurement,@unit,@main,@main_relate,@description_of_target,@created_by)
            OUTPUT INSERTED.id;
          `);
        results.push({ metric_id: t.metric_id, id: r.recordset[0]?.id });
      }
      await transaction.commit();
      res.json({ success: true, message: `${results.length} yearly targets saved`, data: results });
    } catch (txError) {
      await transaction.rollback();
      throw txError;
    }
  } catch (error) {
    logger.error('Error saving yearly targets batch', error);
    res.status(500).json({ success: false, message: 'Failed to save yearly targets' });
  }
});

/**
 * POST /api/kpi-forms/yearly/:id/approve
 */
router.post('/yearly/:id/approve', requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { approval_type } = req.body;
    const pool = await getKpiDb();
    const column =
      approval_type === 'president'
        ? 'president_approved'
        : approval_type === 'vp'
          ? 'vp_approved'
          : 'dept_head_approved';
    await pool
      .request()
      .input('id', sql.Int, Number(id))
      .query(`UPDATE kpi_yearly_targets SET ${column}=1, updated_at=GETDATE() WHERE id=@id`);
    res.json({ success: true, message: 'Approval recorded' });
  } catch (error) {
    logger.error('Error approving yearly target', error);
    res.status(500).json({ success: false, message: 'Failed to approve' });
  }
});

/**
 * GET /api/kpi-forms/yearly/all/:fiscal_year  (admin overview)
 */
router.get('/yearly/all/:fiscal_year', async (req, res) => {
  try {
    const { fiscal_year } = req.params;
    const pool = await getKpiDb();
    let spoPool: any = null;
    try {
      spoPool = await getSpoDb();
    } catch {
      /* optional */
    }
    const deptMap = await loadDeptMap(spoPool);

    const result = await pool.request().input('fiscal_year', sql.Int, parseInt(fiscal_year)).query(`
        SELECT
          yt.id, yt.department_id, yt.category_id,
          yt.fiscal_year, yt.company_policy, yt.department_policy,
          yt.key_actions, yt.fy_target, yt.fy_target_text,
          yt.main_pic, yt.main_support, yt.main_relate,
          yt.metric_no, yt.measurement, yt.unit, yt.main, yt.description_of_target,
          ISNULL(yt.total_quota, 0) as total_target,
          ISNULL(yt.used_quota, 0) as used_quota,
          kc.name as category_name, kc.[key] as category_key
        FROM kpi_yearly_targets yt
        LEFT JOIN kpi_categories kc ON yt.category_id = kc.id
        WHERE yt.fiscal_year = @fiscal_year
        ORDER BY yt.department_id, kc.sort_order, yt.metric_no
      `);

    const data = result.recordset.map((r: any) => {
      const dept = deptMap.get(r.department_id) || { name_en: r.department_id, company: '' };
      return {
        ...r,
        department_name: dept.name_en,
        company: dept.company,
        main_relate_display: resolveDeptIds(r.main_relate, deptMap),
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching all yearly targets', error);
    res.status(500).json({ success: false, message: 'Failed to fetch yearly targets' });
  }
});

/**
 * GET /api/kpi-forms/yearly/pending/:fiscal_year
 */
router.get('/yearly/pending/:fiscal_year', async (req, res) => {
  try {
    const { fiscal_year } = req.params;
    const pool = await getKpiDb();
    let spoPool: any = null;
    try {
      spoPool = await getSpoDb();
    } catch {
      /* optional */
    }
    const deptMap = await loadDeptMap(spoPool);

    const result = await pool.request().input('fiscal_year', sql.Int, parseInt(fiscal_year)).query(`
        SELECT
          yt.id, yt.department_id, yt.category_id,
          yt.fiscal_year, yt.fy_target, yt.fy_target_text, yt.key_actions, yt.main_pic,
          yt.president_approved, yt.vp_approved, yt.dept_head_approved, yt.created_at,
          yt.metric_no, yt.measurement,
          kc.name as category_name
        FROM kpi_yearly_targets yt
        LEFT JOIN kpi_categories kc ON yt.category_id = kc.id
        WHERE yt.fiscal_year = @fiscal_year AND yt.fy_target IS NOT NULL
        ORDER BY yt.president_approved ASC, yt.vp_approved ASC, yt.dept_head_approved ASC,
                 yt.department_id, kc.sort_order
      `);

    const data = result.recordset.map((r: any) => {
      const dept = deptMap.get(r.department_id) || { name_en: r.department_id, company: '' };
      return { ...r, department_name: dept.name_en, company: dept.company };
    });

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching pending yearly approvals', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending approvals' });
  }
});

/**
 * GET /api/kpi-forms/stats/:department_id/:fiscal_year
 */
router.get('/stats/:department_id/:fiscal_year', async (req, res) => {
  try {
    const { department_id, fiscal_year } = req.params;
    const pool = await getKpiDb();

    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME IN ('kpi_yearly_targets','kpi_categories','kpi_monthly_targets')
    `);
    if (tableCheck.recordset[0].count < 3) return res.json({ success: true, data: {} });

    const [yearlyResult, monthlyTargetsResult, monthlyResultsResult] = await Promise.all([
      pool
        .request()
        .input('department_id', sql.NVarChar, department_id)
        .input('fiscal_year', sql.Int, parseInt(fiscal_year)).query(`
          SELECT kc.[key] as category_key, COUNT(*) as yearly_count
          FROM kpi_yearly_targets yt
          JOIN kpi_categories kc ON yt.category_id = kc.id
          WHERE (yt.department_id = @department_id OR yt.main_relate LIKE '%' + @department_id + '%')
            AND yt.fiscal_year = @fiscal_year
          GROUP BY kc.[key]
        `),
      pool
        .request()
        .input('department_id', sql.NVarChar, department_id)
        .input('fiscal_year', sql.Int, parseInt(fiscal_year)).query(`
          SELECT kc.[key] as category_key, me.month,
            COUNT(*) as total_targets,
            SUM(CASE WHEN me.target IS NOT NULL THEN 1 ELSE 0 END) as targets_set
          FROM kpi_monthly_targets me
          JOIN kpi_categories kc ON me.category_id = kc.id
          WHERE me.department_id = @department_id AND me.fiscal_year = @fiscal_year
          GROUP BY kc.[key], me.month
        `),
      pool
        .request()
        .input('department_id', sql.NVarChar, department_id)
        .input('fiscal_year', sql.Int, parseInt(fiscal_year)).query(`
          SELECT kc.[key] as category_key, me.month,
            SUM(CASE WHEN me.result IS NOT NULL THEN 1 ELSE 0 END) as results_entered,
            SUM(CASE WHEN me.result IS NOT NULL AND me.target IS NOT NULL AND me.result >= me.target THEN 1 ELSE 0 END) as achieved
          FROM kpi_monthly_targets me
          JOIN kpi_categories kc ON me.category_id = kc.id
          WHERE me.department_id = @department_id AND me.fiscal_year = @fiscal_year
          GROUP BY kc.[key], me.month
        `),
    ]);

    type MonthStats = {
      targets: { total: number; set: number };
      results: { entered: number; achieved: number };
    };
    type CatStats = {
      yearly: number;
      total_targets: number;
      total_results: number;
      months: Record<number, MonthStats>;
    };
    const stats: Record<string, CatStats> = {};

    for (const row of yearlyResult.recordset) {
      stats[row.category_key] = {
        yearly: row.yearly_count,
        total_targets: 0,
        total_results: 0,
        months: {},
      };
    }
    for (const row of monthlyTargetsResult.recordset) {
      if (!stats[row.category_key])
        stats[row.category_key] = { yearly: 0, total_targets: 0, total_results: 0, months: {} };
      stats[row.category_key].months[row.month] = {
        targets: { total: row.total_targets, set: row.targets_set },
        results: { entered: 0, achieved: 0 },
      };
      stats[row.category_key].total_targets += row.targets_set;
    }
    for (const row of monthlyResultsResult.recordset) {
      if (!stats[row.category_key])
        stats[row.category_key] = { yearly: 0, total_targets: 0, total_results: 0, months: {} };
      if (!stats[row.category_key].months[row.month]) {
        stats[row.category_key].months[row.month] = {
          targets: { total: 0, set: 0 },
          results: { entered: 0, achieved: 0 },
        };
      }
      stats[row.category_key].months[row.month].results = {
        entered: row.results_entered,
        achieved: row.achieved,
      };
      stats[row.category_key].total_results += row.results_entered;
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching stats', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

export default router;
