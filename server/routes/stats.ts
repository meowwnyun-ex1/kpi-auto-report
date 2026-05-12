import express, { Request, Response, NextFunction } from 'express';
import { getKpiDb } from '../config/database';
import { requireAuth, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';
import * as sql from 'mssql';

const router = express.Router();

/**
 * @route GET /api/stats
 * @desc Get KPI dashboard statistics for specified fiscal year
 * @access Public
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getKpiDb();

    // Get year from query param or use current fiscal year
    const queryYear = req.query.year ? parseInt(req.query.year as string) : null;

    // Get current fiscal year (Thai fiscal year starts April)
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentFiscalYear = currentMonth >= 4 ? now.getFullYear() : now.getFullYear() - 1;

    const fiscalYear = queryYear || currentFiscalYear;

    // Get available fiscal years
    const yearsResult = await db.request().query(`
      SELECT DISTINCT fiscal_year 
      FROM kpi_yearly_targets 
      WHERE fiscal_year IS NOT NULL 
      ORDER BY fiscal_year DESC
    `);
    const availableYears = yearsResult.recordset.map((r: any) => r.fiscal_year);

    // Stats for the specified fiscal year
    const yearStats = await db.request().input('fiscalYear', sql.Int, fiscalYear).query(`
      SELECT 
        (SELECT COUNT(*) FROM kpi_yearly_targets WHERE fiscal_year = @fiscalYear) as totalTargets,
        (SELECT COUNT(*) FROM kpi_yearly_targets WHERE fiscal_year = @fiscalYear AND fy_target IS NOT NULL) as targetsSet,
        (SELECT COUNT(*) FROM kpi_monthly_targets WHERE fiscal_year = @fiscalYear) as monthlyEntries,
        (SELECT COUNT(*) FROM kpi_monthly_targets WHERE fiscal_year = @fiscalYear AND result IS NOT NULL) as resultsEntered,
        (SELECT COUNT(*) FROM kpi_monthly_targets WHERE fiscal_year = @fiscalYear AND result IS NOT NULL AND result >= target) as achievedTargets
    `);

    const stats = yearStats.recordset[0];

    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      success: true,
      data: {
        fiscalYear,
        availableYears,
        totalTargets: stats.totalTargets || 0,
        targetsSet: stats.targetsSet || 0,
        monthlyEntries: stats.monthlyEntries || 0,
        resultsEntered: stats.resultsEntered || 0,
        achievedTargets: stats.achievedTargets || 0,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching KPI stats', error);
    next(error);
  }
});

/**
 * @route GET /api/stats/fy25-summary/:year
 * @desc Get FY25 summary data for specified fiscal year
 * @access Public
 */
router.get('/fy25-summary/:year', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getKpiDb();
    const fiscalYear = parseInt(
      Array.isArray(req.params.year) ? req.params.year[0] : req.params.year
    );

    // Get FY25 summary data
    const summaryQuery = `
      SELECT 
        c.key as category_key,
        c.name as category_name,
        COUNT(DISTINCT yt.id) as total_targets,
        COUNT(DISTINCT CASE WHEN mt.result IS NOT NULL THEN mt.id END) as total_results,
        COUNT(DISTINCT CASE WHEN mt.result >= mt.target THEN mt.id END) as achieved_count,
        COUNT(DISTINCT CASE WHEN mt.result IS NOT NULL AND mt.result < mt.target THEN mt.id END) as not_achieved_count,
        COUNT(DISTINCT CASE WHEN mt.result IS NULL THEN mt.id END) as pending_count,
        ROUND(
          COUNT(DISTINCT CASE WHEN mt.result IS NOT NULL THEN mt.id END) * 100.0 / 
          NULLIF(COUNT(DISTINCT yt.id), 0)
        , 2
        ) as achievement_rate
      FROM kpi_categories c
      LEFT JOIN kpi_yearly_targets yt ON c.id = yt.category_id AND yt.fiscal_year = @fiscalYear
      LEFT JOIN kpi_monthly_targets mt ON yt.id = mt.yearly_target_id
      WHERE yt.fiscal_year = @fiscalYear
      GROUP BY c.key, c.name
      ORDER BY c.sort_order, c.name
    `;

    const result = await db.request().query(summaryQuery);

    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      success: true,
      data: result.recordset.reduce((acc, row) => {
        acc[row.category_key] = {
          total_targets: row.total_targets || 0,
          total_results: row.total_results || 0,
          achieved_count: row.achieved_count || 0,
          not_achieved_count: row.not_achieved_count || 0,
          pending_count: row.pending_count || 0,
          achievement_rate: row.achievement_rate || 0,
          monthly_data: {}, // Could be populated with monthly breakdown if needed
        };
        return acc;
      }, {}),
    });
  } catch (error: any) {
    logger.error('Error fetching FY25 summary:', error);
    next(error);
  }
});

/**
 * @route GET /api/stats/categories
 * @desc Get KPI category distribution
 * @access Public
 */
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getKpiDb();

    const result = await db.request().query(`
      SELECT 
        c.name,
        c.[key],
        COUNT(yt.id) as target_count
      FROM kpi_categories c
      LEFT JOIN kpi_yearly_targets yt ON c.id = yt.category_id
      WHERE c.is_active = 1
      GROUP BY c.id, c.name, c.[key]
      ORDER BY target_count DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/stats/departments
 * @desc Get department-wise KPI statistics
 * @access Public
 */
router.get('/departments', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getKpiDb();

    const result = await db.request().query(`
      SELECT 
        dm.kpi_code as department,
        dm.description,
        COUNT(DISTINCT yt.id) as yearly_targets,
        COUNT(DISTINCT me.id) as monthly_entries,
        COUNT(DISTINCT ap.id) as action_plans
      FROM kpi_department_mapping dm
      LEFT JOIN kpi_yearly_targets yt ON dm.kpi_code = yt.main OR dm.kpi_code = yt.main_relate
      LEFT JOIN kpi_monthly_targets me ON dm.kpi_code = me.main OR dm.kpi_code = me.main_relate
      LEFT JOIN kpi_action_plans ap ON dm.kpi_code = ap.department_id
      GROUP BY dm.kpi_code, dm.description
      ORDER BY yearly_targets DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/stats/overview
 * @desc Get KPI overview for dashboard
 * @access Public
 */
router.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getKpiDb();

    // Get current year
    const currentYear = new Date().getFullYear();

    const result = await db.request().input('currentYear', sql.Int, currentYear).query(`
      SELECT 
        (SELECT COUNT(*) FROM kpi_yearly_targets WHERE fiscal_year = @currentYear) as currentYearTargets,
        (SELECT COUNT(*) FROM kpi_monthly_targets WHERE month = MONTH(GETDATE())) as currentMonthEntries,
        (SELECT COUNT(*) FROM kpi_action_plans WHERE fiscal_year = @currentYear) as currentYearActionPlans,
        (SELECT COUNT(DISTINCT main) FROM kpi_yearly_targets) as departmentsWithTargets
    `);

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/stats/all/:fiscal_year
 * @desc Get KPI statistics for all departments
 * @access Public
 */
router.get('/all/:fiscal_year', async (req, res) => {
  try {
    const { fiscal_year } = req.params;
    const db = await getKpiDb();
    const fiscalYear = parseInt(fiscal_year);

    // Get stats for all departments
    const statsResult = await db.request().input('fiscal_year', sql.Int, fiscalYear).query(`
      SELECT 
        kc.[key] as category_key,
        kc.name as category_name,
        COUNT(*) as total_targets,
        SUM(CASE WHEN yt.fy_target IS NOT NULL THEN 1 ELSE 0 END) as targets_set,
        SUM(CASE WHEN mt.result IS NOT NULL THEN 1 ELSE 0 END) as results_entered,
        SUM(CASE WHEN mt.result IS NOT NULL AND mt.result >= yt.fy_target THEN 1 ELSE 0 END) as achieved_targets
      FROM kpi_yearly_targets yt
      LEFT JOIN kpi_categories kc ON yt.category_id = kc.id
      LEFT JOIN kpi_monthly_targets mt ON yt.id = mt.yearly_target_id AND mt.fiscal_year = yt.fiscal_year
      WHERE yt.fiscal_year = @fiscal_year
      GROUP BY kc.[key], kc.name
      ORDER BY kc.[key]
    `);

    const stats = statsResult.recordset;

    // Convert to expected format
    const statsData: Record<string, any> = {};
    stats.forEach((row: any) => {
      statsData[row.category_key] = {
        category_name: row.category_name,
        total_targets: row.total_targets || 0,
        targets_set: row.targets_set || 0,
        results_entered: row.results_entered || 0,
        achieved_targets: row.achieved_targets || 0,
        total_results: row.results_entered || 0,
      };
    });

    res.json({ success: true, data: statsData });
  } catch (error: any) {
    logger.error('Error fetching all department stats', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

/**
 * @route GET /api/stats/system-health
 * @desc Get system health metrics
 * @access Private (admin only)
 */
router.get('/system-health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getKpiDb();

    const healthResult = await db.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM kpi_categories WHERE is_active = 1) as active_categories,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as active_users,
        (SELECT COUNT(*) FROM kpi_department_mapping) as mapped_departments,
        (SELECT COUNT(*) FROM kpi_yearly_targets WHERE fiscal_year = YEAR(GETDATE())) as current_year_targets
    `);

    const health = healthResult.recordset[0];

    const activeResources =
      (health.active_categories || 0) +
      (health.active_users || 0) +
      (health.mapped_departments || 0);

    res.json({
      success: true,
      data: [
        { name: 'Categories', value: health.active_categories || 0, fullMark: 20 },
        { name: 'Users', value: health.active_users || 0, fullMark: 50 },
        { name: 'Departments', value: health.mapped_departments || 0, fullMark: 30 },
        { name: 'Targets', value: health.current_year_targets || 0, fullMark: 100 },
        { name: 'Activity', value: Math.min(100, activeResources * 2), fullMark: 100 },
      ],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/stats/storage
 * @desc Get database storage statistics
 * @access Private (admin only)
 */
router.get(
  '/storage',
  requireAuth,
  requireRole('admin'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const db = await getKpiDb();

      const dbSizeResult = await db.request().query(`
        SELECT 
          CAST(SUM(size * 8.0 / 1024) AS DECIMAL(10,2)) as database_mb
        FROM sys.database_files
        WHERE type_desc = 'ROWS'
      `);

      const logSizeResult = await db.request().query(`
        SELECT 
          CAST(SUM(size * 8.0 / 1024) AS DECIMAL(10,2)) as logs_mb
        FROM sys.database_files
        WHERE type_desc = 'LOG'
      `);

      const tableCounts = await db.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM kpi_yearly_targets) as yearly_targets,
          (SELECT COUNT(*) FROM kpi_monthly_targets) as monthly_entries,
          (SELECT COUNT(*) FROM kpi_action_plans) as action_plans,
          (SELECT COUNT(*) FROM users) as users
      `);

      const storage = {
        database_mb: parseFloat(dbSizeResult.recordset[0]?.database_mb || '0'),
        logs_mb: parseFloat(logSizeResult.recordset[0]?.logs_mb || '0'),
        ...tableCounts.recordset[0],
      };

      res.json({
        success: true,
        data: storage,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/stats/target-completion
 * @desc Get target completion statistics for badge (completed/total targets by FY, pending approvals, activity alerts)
 * @access Public
 */
router.get('/target-completion', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getKpiDb();

    // Get current fiscal year (Thai fiscal year starts April)
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const fiscalYear = currentMonth >= 4 ? now.getFullYear() : now.getFullYear() - 1;

    // Allow override via query param
    const queryYear = req.query.year ? parseInt(req.query.year as string) : fiscalYear;

    // Count total active yearly targets (excluding archived)
    const totalTargetsResult = await db.request().input('fiscalYear', sql.Int, queryYear).query(`
      SELECT COUNT(*) as total
      FROM kpi_yearly_targets
      WHERE fiscal_year = @fiscalYear
        AND is_active = 1
    `);

    // Count targets with super complete results (approved by HOS, HOD, and Admin)
    const completedTargetsResult = await db.request().input('fiscalYear', sql.Int, queryYear)
      .query(`
      SELECT COUNT(DISTINCT yt.id) as completed
      FROM kpi_yearly_targets yt
      INNER JOIN kpi_monthly_targets mt ON yt.id = mt.yearly_target_id
      INNER JOIN kpi_monthly_results mr ON mt.id = mr.monthly_target_id
      WHERE yt.fiscal_year = @fiscalYear
        AND yt.is_active = 1
        AND mr.approval_status = 'approved'
        AND mr.hos_approved = 1
        AND mr.hod_approved = 1
        AND mr.admin_approved = 1
        AND mr.is_incomplete = 0
    `);

    // Count pending approvals (pending, under_review status)
    const pendingApprovalsResult = await db.request().input('fiscalYear', sql.Int, queryYear)
      .query(`
      SELECT COUNT(*) as pending
      FROM (
        SELECT id, 'yearly_target' as type FROM kpi_yearly_targets WHERE fiscal_year = @fiscalYear AND approval_status IN ('pending', 'under_review') AND is_active = 1
        UNION ALL
        SELECT id, 'monthly_target' as type FROM kpi_monthly_targets WHERE fiscal_year = @fiscalYear AND approval_status IN ('pending', 'under_review') AND is_active = 1
        UNION ALL
        SELECT id, 'monthly_result' as type FROM kpi_monthly_results mr
        INNER JOIN kpi_monthly_targets mt ON mr.monthly_target_id = mt.id
        INNER JOIN kpi_yearly_targets yt ON mt.yearly_target_id = yt.id
        WHERE yt.fiscal_year = @fiscalYear AND mr.approval_status IN ('pending', 'under_review') AND mr.is_active = 1
      ) as pending_items
    `);

    // Count activity alerts (unread notifications)
    const activityAlertsResult = await db.request().input('fiscalYear', sql.Int, queryYear).query(`
      SELECT COUNT(*) as alerts
      FROM kpi_notifications
      WHERE is_read = 0
        AND is_active = 1
        AND created_at >= DATEFROMPARTS(@fiscalYear, 4, 1)
    `);

    const totalTargets = totalTargetsResult.recordset[0]?.total || 0;
    const completedTargets = completedTargetsResult.recordset[0]?.completed || 0;
    const pendingApprovals = pendingApprovalsResult.recordset[0]?.pending || 0;
    const activityAlerts = activityAlertsResult.recordset[0]?.alerts || 0;

    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      success: true,
      data: {
        fiscalYear: queryYear,
        completedTargets,
        totalTargets,
        pendingApprovals,
        activityAlerts,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching target completion stats', error);
    next(error);
  }
});

export default router;
