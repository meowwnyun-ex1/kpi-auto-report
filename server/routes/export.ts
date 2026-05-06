import express from 'express';
import sql from 'mssql';
import { getKpiDb } from '../config/database';
import { logger } from '../utils/logger';
import { allowGuest } from '../middleware/auth';

const router = express.Router();

router.use(allowGuest);

// ============================================
// EXCEL EXPORT ROUTES
// ============================================

/**
 * GET /api/export/timeline/:fiscal_year/:month
 * Export timeline data to Excel-compatible CSV format
 */
router.get('/timeline/:fiscal_year/:month', async (req, res) => {
  try {
    const { fiscal_year, month } = req.params;
    const { company } = req.query;
    const pool = await getKpiDb();

    let query = `
      SELECT 
        me.department_id as "Department",
        kc.name as "Category",
        mm.measurement as "Measurement",
        mm.unit as "Unit",
        yt.fy_target as "FY Target",
        me.target as "Target",
        me.result as "Result",
        me.ev as "Judge",
        me.accu_target as "Accumulated Target",
        me.accu_result as "Accumulated Result"
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

    query += ` ORDER BY me.department_id, kc.sort_order`;

    const result = await request.query(query);

    // Convert to CSV
    const headers = Object.keys(result.recordset[0] || {}).join(',');
    const rows = result.recordset
      .map((row) =>
        Object.values(row)
          .map((v) => {
            if (v === null) return '';
            if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) {
              return `"${v.replace(/"/g, '""')}"`;
            }
            return String(v);
          })
          .join(',')
      )
      .join('\n');

    const csv = headers + '\n' + rows;

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthName = months[parseInt(month) - 1];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="KPI_Timeline_${monthName}${fiscal_year}${company && company !== 'all' ? '_' + company : ''}.csv"`
    );
    res.send('\ufeff' + csv); // BOM for Excel UTF-8
  } catch (error) {
    logger.error('Error exporting timeline', error);
    res.status(500).json({ success: false, message: 'Failed to export timeline' });
  }
});

/**
 * GET /api/export/yearly/:fiscal_year
 * Export yearly targets to CSV
 */
router.get('/yearly/:fiscal_year', async (req, res) => {
  try {
    const { fiscal_year } = req.params;
    const { company } = req.query;
    const pool = await getKpiDb();

    let query = `
      SELECT 
        yt.department_id as "Department",
        kc.name as "Category",
        mm.measurement as "Measurement",
        mm.unit as "Unit",
        yt.fy_target as "FY Target",
        yt.fy_target_text as "FY Target (Text)",
        yt.key_actions as "Key Actions",
        yt.main_pic as "Main PIC",
        yt.main_support as "Main Support",
        CASE WHEN yt.president_approved = 1 THEN 'Approved' ELSE 'Pending' END as "President Approval",
        CASE WHEN yt.vp_approved = 1 THEN 'Approved' ELSE 'Pending' END as "VP Approval",
        CASE WHEN yt.dept_head_approved = 1 THEN 'Approved' ELSE 'Pending' END as "Dept Head Approval"
      FROM kpi_yearly_targets yt
      LEFT JOIN kpi_categories kc ON yt.category_id = kc.id
      LEFT JOIN kpi_measurements mm ON yt.measurement_id = mm.id
      WHERE yt.fiscal_year = @fiscal_year
    `;

    const request = pool.request().input('fiscal_year', sql.Int, parseInt(fiscal_year));

    if (company && company !== 'all') {
      request.input('company', sql.NVarChar, company);
    }

    query += ` ORDER BY yt.department_id, kc.sort_order`;

    const result = await request.query(query);

    const headers = Object.keys(result.recordset[0] || {}).join(',');
    const rows = result.recordset
      .map((row) =>
        Object.values(row)
          .map((v) => {
            if (v === null) return '';
            if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) {
              return `"${v.replace(/"/g, '""')}"`;
            }
            return String(v);
          })
          .join(',')
      )
      .join('\n');

    const csv = headers + '\n' + rows;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="KPI_Yearly_Targets_FY${fiscal_year}${company && company !== 'all' ? '_' + company : ''}.csv"`
    );
    res.send('\ufeff' + csv);
  } catch (error) {
    logger.error('Error exporting yearly targets', error);
    res.status(500).json({ success: false, message: 'Failed to export yearly targets' });
  }
});

/**
 * GET /api/export/action-plans/:fiscal_year
 * Export action plans to CSV
 */
router.get('/action-plans/:fiscal_year', async (req, res) => {
  try {
    const { fiscal_year } = req.params;
    const { company } = req.query;
    const pool = await getKpiDb();

    let query = `
      SELECT 
        ap.department_id as "Company",
        ap.department_id as "Department",
        ap.key_action as "Key Action",
        ap.action_plan as "Action Plan",
        ap.target_of_action as "Target",
        ap.result_of_action as "Result",
        ap.person_in_charge as "PIC",
        ap.start_month as "Start Month",
        ap.end_month as "End Month",
        ap.status as "Status",
        ap.progress_percent as "Progress %",
        ap.pdca_stage as "PDCA Stage",
        ap.jan_status as "Jan",
        ap.feb_status as "Feb",
        ap.mar_status as "Mar",
        ap.apr_status as "Apr",
        ap.may_status as "May",
        ap.jun_status as "Jun",
        ap.jul_status as "Jul",
        ap.aug_status as "Aug",
        ap.sep_status as "Sep",
        ap.oct_status as "Oct",
        ap.nov_status as "Nov",
        ap.dec_status as "Dec"
      FROM kpi_action_plans ap
      WHERE ap.fiscal_year = @fiscal_year
    `;

    const request = pool.request().input('fiscal_year', sql.Int, parseInt(fiscal_year));

    if (company && company !== 'all') {
      query += ` AND ap.department_id = @company`;
      request.input('company', sql.NVarChar, company);
    }

    query += ` ORDER BY ap.department_id, ap.sort_order`;

    const result = await request.query(query);

    const headers = Object.keys(result.recordset[0] || {}).join(',');
    const rows = result.recordset
      .map((row) =>
        Object.values(row)
          .map((v) => {
            if (v === null) return '';
            if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) {
              return `"${v.replace(/"/g, '""')}"`;
            }
            return String(v);
          })
          .join(',')
      )
      .join('\n');

    const csv = headers + '\n' + rows;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="KPI_Action_Plans_FY${fiscal_year}${company && company !== 'all' ? '_' + company : ''}.csv"`
    );
    res.send('\ufeff' + csv);
  } catch (error) {
    logger.error('Error exporting action plans', error);
    res.status(500).json({ success: false, message: 'Failed to export action plans' });
  }
});

/**
 * GET /api/export/summary/:fiscal_year
 * Export complete KPI summary report (like FY25 Company KPI summary result.xlsx)
 */
router.get('/summary/:fiscal_year', async (req, res) => {
  try {
    const { fiscal_year } = req.params;
    const { company } = req.query;
    const pool = await getKpiDb();

    // Get all monthly entries with full details
    let query = `
      SELECT 
        me.department_id as "Department",
        kc.name as "Category",
        mm.measurement as "Measurement",
        mm.unit as "Unit",
        yt.fy_target as "FY Target",
        me.month as "Month",
        me.target as "Monthly Target",
        me.result as "Monthly Result",
        me.ev as "Judge",
        me.accu_target as "Accumulated Target",
        me.accu_result as "Accumulated Result",
        me.forecast as "Forecast",
        me.reason as "Reason",
        me.recover_activity as "Recovery Activity"
      FROM kpi_monthly_targets me
      LEFT JOIN kpi_categories kc ON me.category_id = kc.id
      LEFT JOIN kpi_yearly_targets yt ON yt.id = me.yearly_target_id
      LEFT JOIN kpi_measurements mm ON yt.measurement_id = mm.id
      WHERE me.fiscal_year = @fiscal_year
    `;

    const request = pool.request().input('fiscal_year', sql.Int, parseInt(fiscal_year));

    if (company && company !== 'all') {
      request.input('company', sql.NVarChar, company);
    }

    query += ` ORDER BY me.department_id, kc.sort_order, me.month`;

    const result = await request.query(query);

    const headers = Object.keys(result.recordset[0] || {}).join(',');
    const rows = result.recordset
      .map((row) =>
        Object.values(row)
          .map((v) => {
            if (v === null) return '';
            if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) {
              return `"${v.replace(/"/g, '""')}"`;
            }
            return String(v);
          })
          .join(',')
      )
      .join('\n');

    const csv = headers + '\n' + rows;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="KPI_Summary_FY${fiscal_year}${company && company !== 'all' ? '_' + company : ''}.csv"`
    );
    res.send('\ufeff' + csv);
  } catch (error) {
    logger.error('Error exporting summary', error);
    res.status(500).json({ success: false, message: 'Failed to export summary' });
  }
});

export default router;
