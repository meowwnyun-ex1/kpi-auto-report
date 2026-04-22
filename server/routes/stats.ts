import express, { Request, Response, NextFunction } from 'express';
import { getKpiDb } from '../config/database';
import { requireAuth, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

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
    const yearStats = await db.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM kpi_yearly_targets WHERE fiscal_year = ${fiscalYear}) as totalTargets,
        (SELECT COUNT(*) FROM kpi_yearly_targets WHERE fiscal_year = ${fiscalYear} AND fy_target IS NOT NULL) as targetsSet,
        (SELECT COUNT(*) FROM kpi_monthly_targets WHERE fiscal_year = ${fiscalYear}) as monthlyEntries,
        (SELECT COUNT(*) FROM kpi_monthly_targets WHERE fiscal_year = ${fiscalYear} AND result IS NOT NULL) as resultsEntered,
        (SELECT COUNT(*) FROM kpi_monthly_targets WHERE fiscal_year = ${fiscalYear} AND result IS NOT NULL AND result >= target) as achievedTargets
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

    const result = await db.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM kpi_yearly_targets WHERE fiscal_year = ${currentYear}) as currentYearTargets,
        (SELECT COUNT(*) FROM kpi_monthly_targets WHERE month = MONTH(GETDATE())) as currentMonthEntries,
        (SELECT COUNT(*) FROM kpi_action_plans WHERE fiscal_year = ${currentYear}) as currentYearActionPlans,
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
 * @route GET /api/stats/system-health
 * @desc Get system health metrics
 * @access Public
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

export default router;
