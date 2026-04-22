import express from 'express';
import sql from 'mssql';
import { getKpiDb, getSpoDb } from '../config/database';
import { logger } from '../utils/logger';
import { allowGuest, requireManager } from '../middleware/auth';
import { loadDeptMap } from './kpi-yearly';

const router = express.Router();
router.use(allowGuest);

/**
 * GET /api/kpi-forms/action-plans/:department_id/:fiscal_year
 */
router.get('/action-plans/:department_id/:fiscal_year', async (req, res) => {
  try {
    const { department_id, fiscal_year } = req.params;
    const pool = await getKpiDb();
    let spoPool: any = null;
    try {
      spoPool = await getSpoDb();
    } catch {
      /* optional */
    }
    const deptMap = await loadDeptMap(spoPool);
    const dept = deptMap.get(department_id);
    const deptName = dept?.name_en || department_id;

    const result = await pool
      .request()
      .input('department_id', sql.NVarChar, department_id)
      .input('fiscal_year', sql.Int, parseInt(fiscal_year)).query(`
        SELECT
          ap.id, ap.department_id, ap.yearly_target_id, ap.fiscal_year,
          ap.key_action, ap.action_plan, ap.action_detail,
          ap.target_of_action, ap.result_of_action, ap.person_in_charge,
          ap.start_month, ap.end_month, ap.lead_time_months,
          ap.actual_start_date, ap.actual_end_date, ap.actual_kickoff,
          ap.status, ap.progress_percent, ap.pdca_stage, ap.pdca_notes,
          ap.jan_status, ap.feb_status, ap.mar_status, ap.apr_status,
          ap.may_status, ap.jun_status, ap.jul_status, ap.aug_status,
          ap.sep_status, ap.oct_status, ap.nov_status, ap.dec_status,
          ap.sort_order
        FROM kpi_action_plans ap
        WHERE ap.department_id = @department_id AND ap.fiscal_year = @fiscal_year
        ORDER BY ap.sort_order, ap.start_month
      `);

    const data = result.recordset.map((r: any) => ({ ...r, department_name: deptName }));
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching action plans', error);
    res.status(500).json({ success: false, message: 'Failed to fetch action plans' });
  }
});

/**
 * POST /api/kpi-forms/action-plans  (create or update)
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

    const monthCols = `jan_status=@jan_status, feb_status=@feb_status, mar_status=@mar_status,
      apr_status=@apr_status, may_status=@may_status, jun_status=@jun_status,
      jul_status=@jul_status, aug_status=@aug_status, sep_status=@sep_status,
      oct_status=@oct_status, nov_status=@nov_status, dec_status=@dec_status`;

    const addMonthParams = (r: sql.Request) =>
      r
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
        .input('dec_status', sql.NVarChar(10), dec_status);

    if (id) {
      const req2 = pool
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
        .input('sort_order', sql.Int, sort_order);
      addMonthParams(req2);
      await req2.query(`
        UPDATE kpi_action_plans SET
          key_action=@key_action, action_plan=@action_plan, action_detail=@action_detail,
          target_of_action=@target_of_action, result_of_action=@result_of_action,
          person_in_charge=@person_in_charge, start_month=@start_month, end_month=@end_month,
          lead_time_months=@lead_time_months, actual_start_date=@actual_start_date,
          actual_end_date=@actual_end_date, actual_kickoff=@actual_kickoff,
          status=@status, progress_percent=@progress_percent,
          pdca_stage=@pdca_stage, pdca_notes=@pdca_notes,
          ${monthCols}, sort_order=@sort_order, updated_at=GETDATE()
        WHERE id=@id
      `);
      res.json({ success: true, message: 'Action plan updated', data: { id } });
    } else {
      const req2 = pool
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
        .input('sort_order', sql.Int, sort_order || 0)
        .input('created_by', sql.Int, userId);
      addMonthParams(req2);
      const r = await req2.query(`
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
        ) OUTPUT INSERTED.id
        VALUES (
          @department_id, @yearly_target_id, @fiscal_year,
          @key_action, @action_plan, @action_detail,
          @target_of_action, @result_of_action, @person_in_charge,
          @start_month, @end_month, @lead_time_months,
          @actual_start_date, @actual_end_date, @actual_kickoff,
          @status, @progress_percent, @pdca_stage, @pdca_notes,
          @jan_status, @feb_status, @mar_status, @apr_status, @may_status, @jun_status,
          @jul_status, @aug_status, @sep_status, @oct_status, @nov_status, @dec_status,
          @sort_order, @created_by
        )
      `);
      res.json({ success: true, message: 'Action plan created', data: { id: r.recordset[0]?.id } });
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
    const r = await spoPool
      .request()
      .input('dept_id', sql.NVarChar, id)
      .query(`SELECT Section_name as name_en FROM dept_master WHERE ID = @dept_id`);
    res.json({ success: true, message: 'Action plan deleted' });
  } catch (error) {
    logger.error('Error deleting action plan', error);
    res.status(500).json({ success: false, message: 'Failed to delete action plan' });
  }
});

/**
 * GET /api/kpi-forms/action-plans/all/:fiscal_year  (admin overview)
 */
router.get('/action-plans/all/:fiscal_year', async (req, res) => {
  try {
    const { fiscal_year } = req.params;
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
        ap.id, ap.department_id, ap.yearly_target_id, ap.fiscal_year,
        ap.key_action, ap.action_plan, ap.action_detail,
        ap.target_of_action, ap.result_of_action, ap.person_in_charge,
        ap.start_month, ap.end_month, ap.lead_time_months,
        ap.actual_start_date, ap.actual_end_date, ap.actual_kickoff,
        ap.status, ap.progress_percent, ap.pdca_stage, ap.pdca_notes,
        ap.jan_status, ap.feb_status, ap.mar_status, ap.apr_status,
        ap.may_status, ap.jun_status, ap.jul_status, ap.aug_status,
        ap.sep_status, ap.oct_status, ap.nov_status, ap.dec_status, ap.sort_order
      FROM kpi_action_plans ap
      WHERE ap.fiscal_year = @fiscal_year
    `;
    const request = pool.request().input('fiscal_year', sql.Int, parseInt(fiscal_year));

    if (company && company !== 'all') {
      const ids = Array.from(deptMap.values())
        .filter((d: any) => d.company === company)
        .map((d: any) => `'${d.dept_id}'`)
        .join(',');
      if (ids) query += ` AND ap.department_id IN (${ids})`;
    }
    query += ` ORDER BY ap.department_id, ap.sort_order, ap.start_month`;

    const result = await request.query(query);
    const data = result.recordset.map((r: any) => {
      const dept = deptMap.get(r.department_id) || { name_en: r.department_id, company: '' };
      return { ...r, department_name: dept.name_en, company: dept.company };
    });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching all action plans', error);
    res.status(500).json({ success: false, message: 'Failed to fetch action plans' });
  }
});

export default router;
