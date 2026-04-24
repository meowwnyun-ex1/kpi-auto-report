import express from 'express';
import sql from 'mssql';
import { getKpiDb, getSpoDb } from '../config/database';
import { logger } from '../utils/logger';
import { allowGuest, requireManager } from '../middleware/auth';
import { loadDeptMap } from './kpi-yearly';

const router = express.Router();
router.use(allowGuest);

async function resolveDeptName(
  pool: sql.ConnectionPool,
  deptId: string,
  spoPool: any | null
): Promise<string> {
  try {
    const r = await pool
      .request()
      .input('kpi_code', sql.NVarChar, deptId)
      .query(`SELECT description FROM kpi_department_mapping WHERE kpi_code = @kpi_code`);
    if (r.recordset[0]?.description) return r.recordset[0].description;
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

/**
 * GET /api/kpi-forms/monthly/:department_id/:fiscal_year/:month
 * Returns ALL yearly targets joined with monthly data (LEFT JOIN) so every row shows
 * even if no monthly entry exists yet.
 */
router.get('/monthly/:department_id/:fiscal_year/:month', async (req, res) => {
  try {
    const { department_id, fiscal_year, month } = req.params;
    const { category } = req.query;
    const pool = await getKpiDb();

    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME IN ('kpi_monthly_targets','kpi_yearly_targets','kpi_categories')
    `);
    if (tableCheck.recordset[0].count < 3) return res.json({ success: true, data: [] });

    const user = (req as any).user;
    if (user?.role === 'manager' && user?.department_id && department_id !== user.department_id) {
      const check = await pool
        .request()
        .input('userDept', sql.NVarChar, user.department_id)
        .input('targetDept', sql.NVarChar, department_id)
        .query(
          `SELECT COUNT(*) as cnt FROM kpi_yearly_targets WHERE department_id=@targetDept AND main_relate LIKE '%'+@userDept+'%'`
        );
      if (check.recordset[0].cnt === 0) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    let spoPool: any = null;
    try {
      spoPool = await getSpoDb();
    } catch {
      /* optional */
    }
    const deptName = await resolveDeptName(pool, department_id, spoPool);

    const request = pool
      .request()
      .input('department_id', sql.NVarChar, department_id)
      .input('fiscal_year', sql.Int, parseInt(fiscal_year))
      .input('month', sql.TinyInt, parseInt(month));

    let categoryFilter = '';
    if (category && category !== 'all') {
      categoryFilter = `AND kc.[key] = @category`;
      request.input('category', sql.NVarChar, category as string);
    }

    const result = await request.query(`
      SELECT
        yt.id                  as yearly_target_id,
        yt.department_id, yt.category_id,
        yt.fiscal_year,
        yt.measurement, yt.unit, yt.main, yt.main_relate,
        ISNULL(yt.total_quota, 0)                               as total_target,
        ISNULL(yt.used_quota, 0)                                as used_quota,
        ISNULL(yt.total_quota, 0) - ISNULL(yt.used_quota, 0)   as remaining_quota,
        yt.fy_target,
        kc.name        as category_name,
        kc.[key]       as category_key,
        kc.sort_order  as cat_sort,
        me.id          as monthly_id,
        me.target,
        me.result,
        me.ev,
        me.comment,
        me.image_url,
        me.image_caption,
        me.forecast,
        me.reason
      FROM kpi_yearly_targets yt
      INNER JOIN kpi_categories kc ON yt.category_id = kc.id
      LEFT  JOIN kpi_monthly_targets me
             ON  me.yearly_target_id = yt.id
             AND me.fiscal_year      = @fiscal_year
             AND me.month            = @month
             AND me.department_id    = @department_id
      WHERE (yt.department_id = @department_id OR yt.main_relate LIKE '%'+@department_id+'%')
        AND yt.fiscal_year = @fiscal_year
        ${categoryFilter}
      ORDER BY kc.sort_order, yt.id
    `);

    const deptMap = await loadDeptMap(spoPool);
    const data = result.recordset.map((r: any) => ({
      ...r,
      department_name: deptName,
      main_relate_display: resolveDeptIdsLocal(r.main_relate, deptMap),
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Error fetching monthly entries', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly entries',
      error: error.message,
      details: error.toString(),
    });
  }
});

/**
 * GET /api/kpi-forms/monthly/:department_id/:fiscal_year  (all months summary)
 */
router.get('/monthly/:department_id/:fiscal_year', async (req, res) => {
  try {
    const { department_id, fiscal_year } = req.params;
    const pool = await getKpiDb();
    let spoPool: any = null;
    try {
      spoPool = await getSpoDb();
    } catch {
      /* optional */
    }
    const deptName = await resolveDeptName(pool, department_id, spoPool);

    const result = await pool
      .request()
      .input('department_id', sql.NVarChar, department_id)
      .input('fiscal_year', sql.Int, parseInt(fiscal_year)).query(`
        SELECT
          me.id, me.yearly_target_id, me.department_id, me.category_id,
          me.fiscal_year, me.month, me.measurement, me.unit, me.main, me.main_relate,
          me.target, me.result, me.ev,
          me.accu_target, me.accu_result,
          me.forecast, me.reason, me.recover_activity, me.recovery_month,
          me.comment, me.image_url, me.image_caption,
          me.dept_head_approved, me.approved_at,
          kc.name as category_name, kc.[key] as category_key,
          yt.total_quota as total_target, yt.dept_quota as dept_target, yt.fy_target
        FROM kpi_monthly_targets me
        LEFT JOIN kpi_categories kc ON me.category_id = kc.id
        LEFT JOIN kpi_yearly_targets yt ON yt.id = me.yearly_target_id
        WHERE me.department_id = @department_id AND me.fiscal_year = @fiscal_year
        ORDER BY kc.sort_order, me.id, me.month
      `);

    const data = result.recordset.map((r: any) => ({ ...r, department_name: deptName }));
    res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Error fetching monthly entries (all months)', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: 'Failed to fetch monthly entries' });
  }
});

/**
 * POST /api/kpi-forms/monthly/batch
 * Upsert monthly entries with atomic pool quota updates
 */
router.post('/monthly/batch', requireManager, async (req, res) => {
  try {
    const { entries } = req.body;
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'No entries provided' });
    }
    const pool = await getKpiDb();
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      for (const entry of entries) {
        const {
          id,
          yearly_target_id,
          department_id,
          category_id,
          fiscal_year,
          month,
          target,
          result,
          accu_target,
          accu_result,
          forecast,
          reason,
          recover_activity,
          recovery_month,
          comment,
          image_url,
          image_caption,
          main,
          main_relate,
        } = entry;

        if (id) {
          // UPDATE existing entry
          const existing = await transaction
            .request()
            .input('id', sql.Int, id)
            .query(`SELECT target, yearly_target_id FROM kpi_monthly_targets WHERE id=@id`);

          const existingTarget = existing.recordset[0]?.target ?? null;
          const existingYtId = existing.recordset[0]?.yearly_target_id ?? yearly_target_id;

          const updateRequest = transaction.request().input('id', sql.Int, id);
          const fields: string[] = [];

          if (target !== undefined && target !== null) {
            updateRequest.input('target', sql.Decimal(18, 4), target);
            fields.push('target=@target');
            const diff = parseFloat(target) - parseFloat(existingTarget ?? 0);
            if (existingYtId && diff !== 0) {
              await transaction
                .request()
                .input('yt_id', sql.Int, existingYtId)
                .input('diff', sql.Decimal(18, 4), diff)
                .query(
                  `UPDATE kpi_yearly_targets SET used_quota=used_quota+@diff, updated_at=GETDATE() WHERE id=@yt_id`
                );
            }
            // auto ev
            if (result !== undefined && result !== null) {
              updateRequest.input(
                'ev',
                sql.NVarChar(10),
                parseFloat(result) >= parseFloat(target) ? 'O' : 'X'
              );
              fields.push('ev=@ev');
            }
          }
          if (result !== undefined && result !== null) {
            updateRequest.input('result', sql.Decimal(18, 4), result);
            fields.push('result=@result');
            if (target === undefined || target === null) {
              const existResult = existing.recordset[0];
              const tval = existResult?.target ?? null;
              if (tval !== null) {
                updateRequest.input(
                  'ev',
                  sql.NVarChar(10),
                  parseFloat(result) >= parseFloat(tval) ? 'O' : 'X'
                );
                fields.push('ev=@ev');
              }
            }
          }
          if (accu_target !== undefined && accu_target !== null) {
            updateRequest.input('accu_target', sql.Decimal(18, 4), accu_target);
            fields.push('accu_target=@accu_target');
          }
          if (accu_result !== undefined && accu_result !== null) {
            updateRequest.input('accu_result', sql.Decimal(18, 4), accu_result);
            fields.push('accu_result=@accu_result');
          }
          if (forecast !== undefined && forecast !== null) {
            updateRequest.input('forecast', sql.Decimal(18, 4), forecast);
            fields.push('forecast=@forecast');
          }
          if (reason !== undefined) {
            updateRequest.input('reason', sql.NVarChar(1000), reason);
            fields.push('reason=@reason');
          }
          if (recover_activity !== undefined) {
            updateRequest.input('recover_activity', sql.NVarChar(1000), recover_activity);
            fields.push('recover_activity=@recover_activity');
          }
          if (recovery_month !== undefined && recovery_month !== null) {
            updateRequest.input('recovery_month', sql.TinyInt, recovery_month);
            fields.push('recovery_month=@recovery_month');
          }
          if (comment !== undefined) {
            updateRequest.input('comment', sql.NVarChar(sql.MAX), comment);
            fields.push('comment=@comment');
          }
          if (image_url !== undefined) {
            updateRequest.input('image_url', sql.NVarChar(500), image_url);
            fields.push('image_url=@image_url');
          }
          if (image_caption !== undefined) {
            updateRequest.input('image_caption', sql.NVarChar(255), image_caption);
            fields.push('image_caption=@image_caption');
          }
          if (main !== undefined) {
            updateRequest.input('main', sql.NVarChar(50), main);
            fields.push('main=@main');
          }
          if (main_relate !== undefined) {
            updateRequest.input('main_relate', sql.NVarChar(255), main_relate);
            fields.push('main_relate=@main_relate');
          }

          if (fields.length > 0) {
            fields.push('updated_at=GETDATE()');
            await updateRequest.query(
              `UPDATE kpi_monthly_targets SET ${fields.join(',')} WHERE id=@id`
            );
          }
        } else {
          // INSERT new entry
          let resolvedCategoryId = category_id;
          if (!resolvedCategoryId && yearly_target_id) {
            try {
              const ytInfo = await transaction
                .request()
                .input('yt_id', sql.Int, yearly_target_id)
                .query(`SELECT category_id FROM kpi_yearly_targets WHERE id=@yt_id`);
              if (ytInfo.recordset.length > 0) resolvedCategoryId = ytInfo.recordset[0].category_id;
            } catch {
              /* ignore */
            }
          }

          let evValue: string | null = null;
          if (target !== null && target !== undefined && result !== null && result !== undefined) {
            evValue = parseFloat(result) >= parseFloat(target) ? 'O' : 'X';
          }

          await transaction
            .request()
            .input('yearly_target_id', sql.Int, yearly_target_id)
            .input('department_id', sql.NVarChar, department_id)
            .input('category_id', sql.Int, resolvedCategoryId)
            .input('fiscal_year', sql.Int, fiscal_year)
            .input('month', sql.TinyInt, month)
            .input('target', sql.Decimal(18, 4), target ?? null)
            .input('result', sql.Decimal(18, 4), result ?? null)
            .input('accu_target', sql.Decimal(18, 4), accu_target ?? null)
            .input('accu_result', sql.Decimal(18, 4), accu_result ?? null)
            .input('forecast', sql.Decimal(18, 4), forecast ?? null)
            .input('reason', sql.NVarChar(1000), reason ?? null)
            .input('recover_activity', sql.NVarChar(1000), recover_activity ?? null)
            .input('recovery_month', sql.TinyInt, recovery_month ?? null)
            .input('comment', sql.NVarChar(sql.MAX), comment ?? null)
            .input('image_url', sql.NVarChar(500), image_url ?? null)
            .input('image_caption', sql.NVarChar(255), image_caption ?? null)
            .input('ev', sql.NVarChar(10), evValue).query(`
              INSERT INTO kpi_monthly_targets
                (yearly_target_id,department_id,category_id,fiscal_year,month,
                 target,result,accu_target,accu_result,forecast,reason,
                 recover_activity,recovery_month,comment,image_url,image_caption,ev)
              VALUES
                (@yearly_target_id,@department_id,@category_id,@fiscal_year,@month,
                 @target,@result,@accu_target,@accu_result,@forecast,@reason,
                 @recover_activity,@recovery_month,@comment,@image_url,@image_caption,@ev)
            `);

          // Atomic pool increment on new insert
          if (yearly_target_id && target !== null && target !== undefined) {
            await transaction
              .request()
              .input('yt_id', sql.Int, yearly_target_id)
              .input('target', sql.Decimal(18, 4), target)
              .query(
                `UPDATE kpi_yearly_targets SET used_quota=used_quota+@target, updated_at=GETDATE() WHERE id=@yt_id`
              );
          }
        }
      }

      await transaction.commit();
      res.json({ success: true, message: `Saved ${entries.length} entries` });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error: any) {
    logger.error('Error saving monthly entries', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save monthly entries',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/kpi-forms/monthly-targets/batch  (target-only batch update)
 */
router.post('/monthly-targets/batch', requireManager, async (req, res) => {
  try {
    const { month, targets } = req.body;
    const pool = await getKpiDb();
    const transaction = pool.transaction();
    await transaction.begin();
    try {
      for (const t of targets) {
        await transaction
          .request()
          .input('yearly_target_id', sql.Int, t.yearly_target_id)
          .input('target', sql.Decimal(18, 4), t.target)
          .input('month', sql.TinyInt, month)
          .query(
            `UPDATE kpi_monthly_targets SET target=@target, updated_at=GETDATE() WHERE yearly_target_id=@yearly_target_id AND month=@month`
          );
      }
      await transaction.commit();
      res.json({ success: true, message: `Saved ${targets.length} monthly targets` });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    logger.error('Error saving monthly targets', error);
    res.status(500).json({ success: false, message: 'Failed to save monthly targets' });
  }
});

/**
 * PUT /api/kpi-forms/monthly/:yearlyTargetId/:month
 * Update individual monthly target
 */
router.put('/monthly/:yearlyTargetId/:month', requireManager, async (req, res) => {
  try {
    const yearlyTargetId = Array.isArray(req.params.yearlyTargetId)
      ? req.params.yearlyTargetId[0]
      : req.params.yearlyTargetId;
    const month = Array.isArray(req.params.month) ? req.params.month[0] : req.params.month;
    const { target, comment } = req.body;

    const pool = await getKpiDb();
    const userId = (req as any).user?.id;

    // Get yearly target info for validation
    const yearlyTarget = await pool
      .request()
      .input('yearlyTargetId', sql.Int, parseInt(yearlyTargetId)).query(`
        SELECT y.id, y.total_target, y.used_quota, y.remaining_quota,
               y.department_id, y.fiscal_year, m.measurement
        FROM kpi_yearly_targets y
        LEFT JOIN kpi_measurements m ON y.metric_id = m.id
        WHERE y.id = @yearlyTargetId
      `);

    if (yearlyTarget.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Yearly target not found' });
    }

    const yearly = yearlyTarget.recordset[0];
    const targetValue = target !== null ? parseFloat(target) : null;

    // Validate target doesn't exceed remaining quota
    if (targetValue !== null && targetValue > yearly.remaining_quota) {
      return res.status(400).json({
        success: false,
        message: `Target (${targetValue}) exceeds remaining quota (${yearly.remaining_quota})`,
      });
    }

    // Upsert monthly target
    const result = await pool
      .request()
      .input('yearly_target_id', sql.Int, parseInt(yearlyTargetId))
      .input('month', sql.Int, parseInt(month))
      .input('target', sql.Decimal(18, 4), targetValue)
      .input('comment', sql.NVarChar(sql.MAX), comment || null)
      .input('updated_by', sql.Int, userId).query(`
        MERGE INTO kpi_monthly_targets AS target
        USING (SELECT @yearly_target_id as yearly_target_id, @month as month) AS source
        ON target.yearly_target_id = source.yearly_target_id AND target.month = source.month
        WHEN MATCHED THEN
          UPDATE SET 
            target = @target,
            comment = @comment,
            updated_at = GETDATE(),
            updated_by = @updated_by
        WHEN NOT MATCHED THEN
          INSERT (yearly_target_id, month, target, comment, created_by, updated_by)
          VALUES (@yearly_target_id, @month, @target, @comment, @updated_by, @updated_by)
        OUTPUT INSERTED.*, $action as action;
      `);

    // Update used quota on yearly target
    if (targetValue !== null) {
      await pool.request().input('yearlyTargetId', sql.Int, parseInt(yearlyTargetId)).query(`
          UPDATE y
          SET y.used_quota = (
            SELECT COALESCE(SUM(m.target), 0)
            FROM kpi_monthly_targets m
            WHERE m.yearly_target_id = @yearlyTargetId
          ),
          y.remaining_quota = y.total_target - y.used_quota
          FROM kpi_yearly_targets y
          WHERE y.id = @yearlyTargetId
        `);
    }

    res.json({
      success: true,
      data: result.recordset[0],
      message: 'Monthly target updated successfully',
    });
  } catch (error: any) {
    logger.error('Error updating monthly target:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update monthly target',
    });
  }
});

/**
 * POST /api/kpi-forms/monthly/:id/approve
 */
router.post('/monthly/:id/approve', requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getKpiDb();
    const userId = (req as any).user?.id;
    await pool
      .request()
      .input('id', sql.Int, Number(id))
      .input('approved_by', sql.Int, userId)
      .query(
        `UPDATE kpi_monthly_targets SET dept_head_approved=1, approved_at=GETDATE(), approved_by=@approved_by, updated_at=GETDATE() WHERE id=@id`
      );
    res.json({ success: true, message: 'Monthly entry approved' });
  } catch (error) {
    logger.error('Error approving monthly entry', error);
    res.status(500).json({ success: false, message: 'Failed to approve' });
  }
});

/**
 * GET /api/kpi-forms/monthly/all/:fiscal_year  (admin overview)
 */
router.get('/monthly/all/:fiscal_year', async (req, res) => {
  try {
    const { fiscal_year } = req.params;
    const { company, month } = req.query;
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
        me.target, me.result, me.accu_target, me.accu_result, me.ev as judge,
        kc.name as category_name, kc.[key] as category_key,
        yt.fy_target, yt.measurement, yt.unit
      FROM kpi_monthly_targets me
      LEFT JOIN kpi_categories kc ON me.category_id = kc.id
      LEFT JOIN kpi_yearly_targets yt ON yt.id = me.yearly_target_id
      WHERE me.fiscal_year = @fiscal_year
    `;
    const request = pool.request().input('fiscal_year', sql.Int, parseInt(fiscal_year));

    if (company && company !== 'all') {
      const ids = Array.from(deptMap.values())
        .filter((d: any) => d.company === company)
        .map((d: any) => `'${d.dept_id}'`)
        .join(',');
      if (ids) query += ` AND me.department_id IN (${ids})`;
    }
    if (month) {
      query += ` AND me.month = @month`;
      request.input('month', sql.TinyInt, parseInt(month as string));
    }
    query += ` ORDER BY me.department_id, kc.sort_order, yt.id, me.month`;

    const result = await request.query(query);
    const data = result.recordset.map((r: any) => {
      const dept = deptMap.get(r.department_id) || { name_en: r.department_id, company: '' };
      return { ...r, department_name: dept.name_en, company: dept.company };
    });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching all monthly entries', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monthly entries' });
  }
});

/**
 * GET /api/kpi-forms/monthly/pending/:fiscal_year/:month
 */
router.get('/monthly/pending/:fiscal_year/:month', async (req, res) => {
  try {
    const { fiscal_year, month } = req.params;
    const pool = await getKpiDb();
    let spoPool: any = null;
    try {
      spoPool = await getSpoDb();
    } catch {
      /* optional */
    }
    const deptMap = await loadDeptMap(spoPool);

    const result = await pool
      .request()
      .input('fiscal_year', sql.Int, parseInt(fiscal_year))
      .input('month', sql.TinyInt, parseInt(month)).query(`
        SELECT
          me.id, me.department_id, me.category_id,
          me.fiscal_year, me.month,
          me.target, me.result, me.ev, me.dept_head_approved, me.approved_at,
          kc.name as category_name,
          yt.measurement, yt.unit
        FROM kpi_monthly_targets me
        LEFT JOIN kpi_categories kc ON me.category_id = kc.id
        LEFT JOIN kpi_yearly_targets yt ON yt.id = me.yearly_target_id
        WHERE me.fiscal_year = @fiscal_year AND me.month = @month
          AND me.result IS NOT NULL
        ORDER BY me.dept_head_approved ASC, me.department_id, kc.sort_order
      `);

    const data = result.recordset.map((r: any) => {
      const dept = deptMap.get(r.department_id) || { name_en: r.department_id, company: '' };
      return { ...r, department_name: dept.name_en, company: dept.company };
    });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching pending monthly entries', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending monthly entries' });
  }
});

// local helper (avoid circular import)
function resolveDeptIdsLocal(raw: string | null | undefined, deptMap: Map<string, any>): string {
  if (!raw) return '';
  return raw
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((code) => deptMap.get(code)?.name_en || code)
    .join(', ');
}

export default router;
