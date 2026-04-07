import express from 'express';
import sql from 'mssql';
import { getKpiDb } from '../config/database';
import { logger } from '../utils/logger';
import { allowGuest, requireManager } from '../middleware/auth';

const router = express.Router();

// Allow guest viewing, require manager for editing
router.use(allowGuest);

// ============================================
// YEARLY TARGETS (Page 1)
// ============================================

/**
 * GET /api/kpi-forms/yearly/:department_id/:fiscal_year
 * Get yearly targets for a department
 */
router.get('/yearly/:department_id/:fiscal_year', async (req, res) => {
  try {
    const { department_id, fiscal_year } = req.params;
    const pool = await getKpiDb();

    const result = await pool
      .request()
      .input('department_id', sql.NVarChar, department_id)
      .input('fiscal_year', sql.Int, parseInt(fiscal_year)).query(`
        SELECT 
          yt.id, yt.department_id, yt.category_id, yt.metric_id,
          yt.fiscal_year, yt.company_policy, yt.department_policy,
          yt.key_actions, yt.remaining_kadai, yt.environment_changes,
          yt.fy_target, yt.fy_target_text, yt.main_pic, yt.main_support,
          yt.support_sdm, yt.support_skd,
          yt.president_approved, yt.vp_approved, yt.dept_head_approved,
          kc.name_en as category_name, kc.key as category_key, kc.color,
          km.measurement, km.unit, km.no as metric_no,
          d.name_en as department_name
        FROM kpi_yearly_targets yt
        LEFT JOIN kpi_categories kc ON yt.category_id = kc.id
        LEFT JOIN kpi_metrics km ON yt.metric_id = km.id
        LEFT JOIN departments d ON yt.department_id = d.dept_id
        WHERE yt.department_id = @department_id AND yt.fiscal_year = @fiscal_year
        ORDER BY kc.sort_order, km.no
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching yearly targets', error);
    res.status(500).json({ success: false, message: 'Failed to fetch yearly targets' });
  }
});

/**
 * POST /api/kpi-forms/yearly
 * Create or update yearly target
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
        ON target.department_id = source.department_id 
           AND target.category_id = source.category_id
           AND ISNULL(target.metric_id, 0) = ISNULL(source.metric_id, 0)
           AND target.fiscal_year = source.fiscal_year
        WHEN MATCHED THEN
          UPDATE SET
            company_policy = @company_policy,
            department_policy = @department_policy,
            key_actions = @key_actions,
            remaining_kadai = @remaining_kadai,
            environment_changes = @environment_changes,
            fy_target = @fy_target,
            fy_target_text = @fy_target_text,
            main_pic = @main_pic,
            main_support = @main_support,
            support_sdm = @support_sdm,
            support_skd = @support_skd,
            updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (department_id, category_id, metric_id, fiscal_year,
                  company_policy, department_policy, key_actions, remaining_kadai, environment_changes,
                  fy_target, fy_target_text, main_pic, main_support, support_sdm, support_skd, created_by)
          VALUES (@department_id, @category_id, @metric_id, @fiscal_year,
                  @company_policy, @department_policy, @key_actions, @remaining_kadai, @environment_changes,
                  @fy_target, @fy_target_text, @main_pic, @main_support, @support_sdm, @support_skd, @created_by)
        OUTPUT INSERTED.id, 'UPSERTED' as action;
      `);

    res.json({
      success: true,
      message: 'Yearly target saved successfully',
      data: { id: result.recordset[0]?.id },
    });
  } catch (error) {
    logger.error('Error saving yearly target', error);
    res.status(500).json({ success: false, message: 'Failed to save yearly target' });
  }
});

/**
 * POST /api/kpi-forms/yearly/:id/approve
 * Approve yearly target (for President/VP/DeptHead)
 */
router.post('/yearly/:id/approve', requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { approval_type } = req.body; // 'president', 'vp', 'dept_head'
    const pool = await getKpiDb();

    const column =
      approval_type === 'president'
        ? 'president_approved'
        : approval_type === 'vp'
          ? 'vp_approved'
          : 'dept_head_approved';

    await pool.request().input('id', sql.Int, parseInt(id)).query(`
        UPDATE kpi_yearly_targets SET ${column} = 1, updated_at = GETDATE()
        WHERE id = @id
      `);

    res.json({ success: true, message: 'Approval recorded' });
  } catch (error) {
    logger.error('Error approving yearly target', error);
    res.status(500).json({ success: false, message: 'Failed to approve' });
  }
});

// ============================================
// MONTHLY ENTRIES (Page 2&3)
// ============================================

/**
 * GET /api/kpi-forms/monthly/:department_id/:fiscal_year
 * Get monthly entries for a department (all 12 months)
 */
router.get('/monthly/:department_id/:fiscal_year', async (req, res) => {
  try {
    const { department_id, fiscal_year } = req.params;
    const pool = await getKpiDb();

    const result = await pool
      .request()
      .input('department_id', sql.NVarChar, department_id)
      .input('fiscal_year', sql.Int, parseInt(fiscal_year)).query(`
        SELECT 
          me.id, me.yearly_target_id, me.department_id, me.category_id, me.metric_id,
          me.fiscal_year, me.month, me.way_of_measurement,
          me.target, me.target_text, me.result, me.result_text, me.ev,
          me.accu_target, me.accu_result,
          me.forecast, me.reason, me.recover_activity, me.recovery_month,
          me.dept_head_approved, me.approved_at,
          me.revision_flag, me.revision_note,
          kc.name_en as category_name, kc.key as category_key, kc.color,
          km.measurement, km.unit, km.no as metric_no,
          d.name_en as department_name
        FROM kpi_monthly_entries me
        LEFT JOIN kpi_categories kc ON me.category_id = kc.id
        LEFT JOIN kpi_metrics km ON me.metric_id = km.id
        LEFT JOIN departments d ON me.department_id = d.dept_id
        WHERE me.department_id = @department_id AND me.fiscal_year = @fiscal_year
        ORDER BY kc.sort_order, km.no, me.month
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching monthly entries', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monthly entries' });
  }
});

/**
 * GET /api/kpi-forms/monthly/all/:department_id
 * Get all historical monthly entries for a department (all years)
 */
router.get('/monthly/all/:department_id', async (req, res) => {
  try {
    const { department_id } = req.params;
    const { category_key } = req.query;
    const pool = await getKpiDb();

    let query = `
      SELECT 
        me.id, me.yearly_target_id, me.department_id, me.category_id, me.metric_id,
        me.fiscal_year, me.month, me.way_of_measurement,
        me.target, me.target_text, me.result, me.result_text, me.ev,
        me.accu_target, me.accu_result,
        me.forecast, me.reason, me.recover_activity, me.recovery_month,
        me.dept_head_approved, me.approved_at,
        me.revision_flag, me.revision_note,
        kc.name_en as category_name, kc.key as category_key, kc.color,
        km.measurement, km.unit, km.no as metric_no,
        d.name_en as department_name
      FROM kpi_monthly_entries me
      LEFT JOIN kpi_categories kc ON me.category_id = kc.id
      LEFT JOIN kpi_metrics km ON me.metric_id = km.id
      LEFT JOIN departments d ON me.department_id = d.dept_id
      WHERE me.department_id = @department_id
    `;

    const request = pool.request().input('department_id', sql.NVarChar, department_id);

    if (category_key) {
      query += ` AND kc.[key] = @category_key`;
      request.input('category_key', sql.NVarChar, category_key);
    }

    query += ` ORDER BY me.fiscal_year DESC, kc.sort_order, km.no, me.month`;

    const result = await request.query(query);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching all historical entries', error);
    res.status(500).json({ success: false, message: 'Failed to fetch historical entries' });
  }
});

/**
 * POST /api/kpi-forms/monthly
 * Create or update monthly entry
 */
router.post('/monthly', requireManager, async (req, res) => {
  try {
    const {
      yearly_target_id,
      department_id,
      category_id,
      metric_id,
      fiscal_year,
      month,
      way_of_measurement,
      target,
      target_text,
      result,
      result_text,
      ev,
      accu_target,
      accu_result,
      forecast,
      reason,
      recover_activity,
      recovery_month,
      revision_flag,
      revision_note,
    } = req.body;

    const pool = await getKpiDb();
    const userId = (req as any).user?.id;

    const result_query = await pool
      .request()
      .input('yearly_target_id', sql.Int, yearly_target_id || null)
      .input('department_id', sql.NVarChar, department_id)
      .input('category_id', sql.Int, category_id)
      .input('metric_id', sql.Int, metric_id || null)
      .input('fiscal_year', sql.Int, fiscal_year)
      .input('month', sql.TinyInt, month)
      .input('way_of_measurement', sql.NVarChar(500), way_of_measurement)
      .input('target', sql.Decimal(18, 4), target)
      .input('target_text', sql.NVarChar(100), target_text)
      .input('result', sql.Decimal(18, 4), result)
      .input('result_text', sql.NVarChar(100), result_text)
      .input('ev', sql.NVarChar(10), ev)
      .input('accu_target', sql.Decimal(18, 4), accu_target)
      .input('accu_result', sql.Decimal(18, 4), accu_result)
      .input('forecast', sql.Decimal(18, 4), forecast)
      .input('reason', sql.NVarChar(1000), reason)
      .input('recover_activity', sql.NVarChar(1000), recover_activity)
      .input('recovery_month', sql.TinyInt, recovery_month)
      .input('revision_flag', sql.Bit, revision_flag ? 1 : 0)
      .input('revision_note', sql.NVarChar(500), revision_note)
      .input('created_by', sql.Int, userId).query(`
        MERGE INTO kpi_monthly_entries AS target
        USING (SELECT @department_id as department_id, @category_id as category_id,
                      @metric_id as metric_id, @fiscal_year as fiscal_year, @month as month) AS source
        ON target.department_id = source.department_id 
           AND target.category_id = source.category_id
           AND ISNULL(target.metric_id, 0) = ISNULL(source.metric_id, 0)
           AND target.fiscal_year = source.fiscal_year
           AND target.month = source.month
        WHEN MATCHED THEN
          UPDATE SET
            yearly_target_id = @yearly_target_id,
            way_of_measurement = @way_of_measurement,
            target = @target, target_text = @target_text,
            result = @result, result_text = @result_text, ev = @ev,
            accu_target = @accu_target, accu_result = @accu_result,
            forecast = @forecast, reason = @reason,
            recover_activity = @recover_activity, recovery_month = @recovery_month,
            revision_flag = @revision_flag, revision_note = @revision_note,
            updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (yearly_target_id, department_id, category_id, metric_id, fiscal_year, month,
                  way_of_measurement, target, target_text, result, result_text, ev,
                  accu_target, accu_result, forecast, reason, recover_activity, recovery_month,
                  revision_flag, revision_note, created_by)
          VALUES (@yearly_target_id, @department_id, @category_id, @metric_id, @fiscal_year, @month,
                  @way_of_measurement, @target, @target_text, @result, @result_text, @ev,
                  @accu_target, @accu_result, @forecast, @reason, @recover_activity, @recovery_month,
                  @revision_flag, @revision_note, @created_by)
        OUTPUT INSERTED.id, 'UPSERTED' as action;
      `);

    res.json({
      success: true,
      message: 'Monthly entry saved successfully',
      data: { id: result_query.recordset[0]?.id },
    });
  } catch (error) {
    logger.error('Error saving monthly entry', error);
    res.status(500).json({ success: false, message: 'Failed to save monthly entry' });
  }
});

/**
 * POST /api/kpi-forms/monthly/:id/approve
 * Approve monthly entry (Dept Head)
 */
router.post('/monthly/:id/approve', requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getKpiDb();
    const userId = (req as any).user?.id;

    await pool.request().input('id', sql.Int, parseInt(id)).input('approved_by', sql.Int, userId)
      .query(`
      UPDATE kpi_monthly_entries 
      SET dept_head_approved = 1, approved_at = GETDATE(), approved_by = @approved_by, updated_at = GETDATE()
      WHERE id = @id
    `);

    res.json({ success: true, message: 'Monthly entry approved' });
  } catch (error) {
    logger.error('Error approving monthly entry', error);
    res.status(500).json({ success: false, message: 'Failed to approve' });
  }
});

// ============================================
// ACTION PLANS (Page 4 - Gantt Chart)
// ============================================

/**
 * GET /api/kpi-forms/action-plans/:department_id/:fiscal_year
 * Get action plans for a department
 */
router.get('/action-plans/:department_id/:fiscal_year', async (req, res) => {
  try {
    const { department_id, fiscal_year } = req.params;
    const pool = await getKpiDb();

    const result = await pool
      .request()
      .input('department_id', sql.NVarChar, department_id)
      .input('fiscal_year', sql.Int, parseInt(fiscal_year)).query(`
        SELECT 
          ap.id, ap.department_id, ap.yearly_target_id, ap.fiscal_year,
          ap.key_action, ap.action_plan, ap.action_detail,
          ap.target_of_action, ap.result_of_action,
          ap.person_in_charge,
          ap.start_month, ap.end_month, ap.lead_time_months,
          ap.actual_start_date, ap.actual_end_date, ap.actual_kickoff,
          ap.status, ap.progress_percent,
          ap.pdca_stage, ap.pdca_notes,
          ap.jan_status, ap.feb_status, ap.mar_status,
          ap.apr_status, ap.may_status, ap.jun_status,
          ap.jul_status, ap.aug_status, ap.sep_status,
          ap.oct_status, ap.nov_status, ap.dec_status,
          ap.sort_order,
          d.name_en as department_name
        FROM kpi_action_plans ap
        LEFT JOIN departments d ON ap.department_id = d.dept_id
        WHERE ap.department_id = @department_id AND ap.fiscal_year = @fiscal_year
        ORDER BY ap.sort_order, ap.start_month
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching action plans', error);
    res.status(500).json({ success: false, message: 'Failed to fetch action plans' });
  }
});

/**
 * POST /api/kpi-forms/action-plans
 * Create or update action plan
 */
router.post('/action-plans', requireManager, async (req, res) => {
  try {
    const {
      id,
      department_id,
      yearly_target_id,
      fiscal_year,
      key_action,
      action_plan,
      action_detail,
      target_of_action,
      result_of_action,
      person_in_charge,
      start_month,
      end_month,
      lead_time_months,
      actual_start_date,
      actual_end_date,
      actual_kickoff,
      status,
      progress_percent,
      pdca_stage,
      pdca_notes,
      jan_status,
      feb_status,
      mar_status,
      apr_status,
      may_status,
      jun_status,
      jul_status,
      aug_status,
      sep_status,
      oct_status,
      nov_status,
      dec_status,
      sort_order,
    } = req.body;

    const pool = await getKpiDb();
    const userId = (req as any).user?.id;

    if (id) {
      // Update existing
      await pool
        .request()
        .input('id', sql.Int, id)
        .input('key_action', sql.NVarChar(500), key_action)
        .input('action_plan', sql.NVarChar(1000), action_plan)
        .input('action_detail', sql.NVarChar(sql.MAX), action_detail)
        .input('target_of_action', sql.NVarChar(500), target_of_action)
        .input('result_of_action', sql.NVarChar(500), result_of_action)
        .input('person_in_charge', sql.NVarChar(100), person_in_charge)
        .input('start_month', sql.TinyInt, start_month)
        .input('end_month', sql.TinyInt, end_month)
        .input('lead_time_months', sql.TinyInt, lead_time_months)
        .input('actual_start_date', sql.Date, actual_start_date)
        .input('actual_end_date', sql.Date, actual_end_date)
        .input('actual_kickoff', sql.Date, actual_kickoff)
        .input('status', sql.NVarChar(20), status)
        .input('progress_percent', sql.TinyInt, progress_percent)
        .input('pdca_stage', sql.NVarChar(10), pdca_stage)
        .input('pdca_notes', sql.NVarChar(500), pdca_notes)
        .input('jan_status', sql.NVarChar(10), jan_status)
        .input('feb_status', sql.NVarChar(10), feb_status)
        .input('mar_status', sql.NVarChar(10), mar_status)
        .input('apr_status', sql.NVarChar(10), apr_status)
        .input('may_status', sql.NVarChar(10), may_status)
        .input('jun_status', sql.NVarChar(10), jun_status)
        .input('jul_status', sql.NVarChar(10), jul_status)
        .input('aug_status', sql.NVarChar(10), aug_status)
        .input('sep_status', sql.NVarChar(10), sep_status)
        .input('oct_status', sql.NVarChar(10), oct_status)
        .input('nov_status', sql.NVarChar(10), nov_status)
        .input('dec_status', sql.NVarChar(10), dec_status)
        .input('sort_order', sql.Int, sort_order).query(`
          UPDATE kpi_action_plans SET
            key_action = @key_action, action_plan = @action_plan, action_detail = @action_detail,
            target_of_action = @target_of_action, result_of_action = @result_of_action,
            person_in_charge = @person_in_charge,
            start_month = @start_month, end_month = @end_month, lead_time_months = @lead_time_months,
            actual_start_date = @actual_start_date, actual_end_date = @actual_end_date,
            actual_kickoff = @actual_kickoff,
            status = @status, progress_percent = @progress_percent,
            pdca_stage = @pdca_stage, pdca_notes = @pdca_notes,
            jan_status = @jan_status, feb_status = @feb_status, mar_status = @mar_status,
            apr_status = @apr_status, may_status = @may_status, jun_status = @jun_status,
            jul_status = @jul_status, aug_status = @aug_status, sep_status = @sep_status,
            oct_status = @oct_status, nov_status = @nov_status, dec_status = @dec_status,
            sort_order = @sort_order, updated_at = GETDATE()
          WHERE id = @id
        `);

      res.json({ success: true, message: 'Action plan updated', data: { id } });
    } else {
      // Create new
      const result = await pool
        .request()
        .input('department_id', sql.NVarChar, department_id)
        .input('yearly_target_id', sql.Int, yearly_target_id || null)
        .input('fiscal_year', sql.Int, fiscal_year)
        .input('key_action', sql.NVarChar(500), key_action)
        .input('action_plan', sql.NVarChar(1000), action_plan)
        .input('action_detail', sql.NVarChar(sql.MAX), action_detail)
        .input('target_of_action', sql.NVarChar(500), target_of_action)
        .input('result_of_action', sql.NVarChar(500), result_of_action)
        .input('person_in_charge', sql.NVarChar(100), person_in_charge)
        .input('start_month', sql.TinyInt, start_month)
        .input('end_month', sql.TinyInt, end_month)
        .input('lead_time_months', sql.TinyInt, lead_time_months)
        .input('actual_start_date', sql.Date, actual_start_date)
        .input('actual_end_date', sql.Date, actual_end_date)
        .input('actual_kickoff', sql.Date, actual_kickoff)
        .input('status', sql.NVarChar(20), status || 'Planned')
        .input('progress_percent', sql.TinyInt, progress_percent || 0)
        .input('pdca_stage', sql.NVarChar(10), pdca_stage)
        .input('pdca_notes', sql.NVarChar(500), pdca_notes)
        .input('jan_status', sql.NVarChar(10), jan_status)
        .input('feb_status', sql.NVarChar(10), feb_status)
        .input('mar_status', sql.NVarChar(10), mar_status)
        .input('apr_status', sql.NVarChar(10), apr_status)
        .input('may_status', sql.NVarChar(10), may_status)
        .input('jun_status', sql.NVarChar(10), jun_status)
        .input('jul_status', sql.NVarChar(10), jul_status)
        .input('aug_status', sql.NVarChar(10), aug_status)
        .input('sep_status', sql.NVarChar(10), sep_status)
        .input('oct_status', sql.NVarChar(10), oct_status)
        .input('nov_status', sql.NVarChar(10), nov_status)
        .input('dec_status', sql.NVarChar(10), dec_status)
        .input('sort_order', sql.Int, sort_order || 0)
        .input('created_by', sql.Int, userId).query(`
          INSERT INTO kpi_action_plans (
            department_id, yearly_target_id, fiscal_year,
            key_action, action_plan, action_detail,
            target_of_action, result_of_action, person_in_charge,
            start_month, end_month, lead_time_months,
            actual_start_date, actual_end_date, actual_kickoff,
            status, progress_percent, pdca_stage, pdca_notes,
            jan_status, feb_status, mar_status, apr_status, may_status, jun_status,
            jul_status, aug_status, sep_status, oct_status, nov_status, dec_status,
            sort_order, created_by
          ) VALUES (
            @department_id, @yearly_target_id, @fiscal_year,
            @key_action, @action_plan, @action_detail,
            @target_of_action, @result_of_action, @person_in_charge,
            @start_month, @end_month, @lead_time_months,
            @actual_start_date, @actual_end_date, @actual_kickoff,
            @status, @progress_percent, @pdca_stage, @pdca_notes,
            @jan_status, @feb_status, @mar_status, @apr_status, @may_status, @jun_status,
            @jul_status, @aug_status, @sep_status, @oct_status, @nov_status, @dec_status,
            @sort_order, @created_by
          );
          SELECT SCOPE_IDENTITY() as id;
        `);

      res.json({
        success: true,
        message: 'Action plan created',
        data: { id: result.recordset[0]?.id },
      });
    }
  } catch (error) {
    logger.error('Error saving action plan', error);
    res.status(500).json({ success: false, message: 'Failed to save action plan' });
  }
});

/**
 * DELETE /api/kpi-forms/action-plans/:id
 */
router.delete('/action-plans/:id', requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getKpiDb();

    await pool.request().input('id', sql.Int, parseInt(id)).query(`
      DELETE FROM kpi_action_plans WHERE id = @id
    `);

    res.json({ success: true, message: 'Action plan deleted' });
  } catch (error) {
    logger.error('Error deleting action plan', error);
    res.status(500).json({ success: false, message: 'Failed to delete action plan' });
  }
});

export default router;
