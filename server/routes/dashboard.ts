import express from 'express';
import { getKpiDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route GET /api/dashboard/summary
 * @desc Get dashboard summary for specified fiscal year
 * @access Private
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const db = await getKpiDb();
    const fiscalYear = req.query.fiscalYear ? parseInt(req.query.fiscalYear as string) : new Date().getFullYear();

    // Get categories summary
    const categoriesResult = await db.request()
      .input('fiscalYear', fiscalYear)
      .query(`
        SELECT 
          c.id,
          c.name,
          c.color,
          c.key as category_key,
          COUNT(DISTINCT yt.id) as total_targets,
          COUNT(DISTINCT CASE WHEN mt.result IS NOT NULL THEN mt.id END) as results_entered,
          COUNT(DISTINCT CASE WHEN mt.result >= mt.target THEN mt.id END) as achieved,
          COUNT(DISTINCT CASE WHEN mt.result IS NOT NULL AND mt.result < mt.target THEN mt.id END) as not_achieved,
          COUNT(DISTINCT CASE WHEN mt.result IS NULL THEN mt.id END) as pending
        FROM kpi_categories c
        LEFT JOIN kpi_yearly_targets yt ON c.id = yt.category_id AND yt.fiscal_year = @fiscalYear
        LEFT JOIN kpi_monthly_targets mt ON yt.id = mt.yearly_target_id
        WHERE c.is_active = 1
        GROUP BY c.id, c.name, c.color, c.key, c.sort_order
        ORDER BY c.sort_order
      `);

    // Calculate overall stats
    const categories = categoriesResult.recordset;
    const totalKPIs = categories.reduce((sum, c) => sum + c.total_targets, 0);
    const achieved = categories.reduce((sum, c) => sum + c.achieved, 0);
    const belowTarget = categories.reduce((sum, c) => sum + c.not_achieved, 0);
    const overallProgress = totalKPIs > 0 ? Math.round(((achieved + belowTarget) / totalKPIs) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalKPIs,
        achieved,
        belowTarget,
        overallProgress,
      },
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        key: c.category_key,
        total: c.total_targets,
        achieved: c.achieved,
        notAchieved: c.not_achieved,
        pending: c.pending,
      })),
      activities: [],
    });
  } catch (error) {
    logger.error('Error fetching dashboard summary', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary' });
  }
});

export default router;
