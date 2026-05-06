import express from 'express';
import sql from 'mssql';
import { getKpiDb } from '../config/database';
import { logger } from '../utils/logger';
import { allowGuest } from '../middleware/auth';

const router = express.Router();
router.use(allowGuest);

/**
 * GET /api/kpi-forms/categories
 */
router.get('/categories', async (_req, res) => {
  try {
    const pool = await getKpiDb();
    const result = await pool.request().query(`
      SELECT id, name, [key], description, sort_order
      FROM kpi_categories
      WHERE is_active = 1
      ORDER BY sort_order
    `);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching categories', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/kpi-forms/measurements/:category
 * Measurements filtered by user's department (main= or main_relate contains dept)
 */
router.get('/measurements/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { department_id } = req.query;
    const pool = await getKpiDb();

    const catResult = await pool
      .request()
      .input('category', sql.NVarChar, category)
      .query(`SELECT id, name FROM kpi_categories WHERE [key] = @category`);

    if (catResult.recordset.length === 0) {
      return res.json({ success: true, data: [], category: null, sub_categories: [] });
    }

    const categoryId = catResult.recordset[0].id;
    const categoryName = catResult.recordset[0].name;

    // All measurements come from kpi_yearly_targets now (no legacy category tables)
    const request = pool.request().input('category_id', sql.Int, categoryId);

    let deptFilter = '';
    if (department_id) {
      deptFilter = `AND (yt.main = @department_id OR yt.main_relate LIKE '%' + @department_id + '%' OR yt.main IS NULL)`;
      request.input('department_id', sql.NVarChar, department_id as string);
    }

    const result = await request.query(`
      SELECT DISTINCT
        yt.id,
        mm.measurement,
        mm.unit,
        mm.main,
        mm.main_relate,
        mm.description_of_target,
        yt.fy_target as fy25_target,
        yt.sort_order
      FROM kpi_yearly_targets yt
      LEFT JOIN kpi_measurements mm ON yt.measurement_id = mm.id
      WHERE yt.category_id = @category_id
        ${deptFilter}
      ORDER BY yt.sort_order, mm.id
    `);

    res.json({
      success: true,
      data: result.recordset,
      category: { id: categoryId, name: categoryName, key: category },
      sub_categories: [],
    });
  } catch (error) {
    logger.error('Error fetching measurements', error);
    res.status(500).json({ success: false, message: 'Failed to fetch measurements' });
  }
});

/**
 * GET /api/kpi-forms/measurements/:category/:department_id
 */
router.get('/measurements/:category/:department_id', async (req, res) => {
  try {
    const { category, department_id } = req.params;
    const pool = await getKpiDb();

    const catResult = await pool
      .request()
      .input('category_key', sql.NVarChar, category)
      .query(`SELECT id FROM kpi_categories WHERE [key] = @category_key`);

    if (catResult.recordset.length === 0) {
      return res.json({ success: true, data: [] });
    }
    const categoryId = catResult.recordset[0].id;

    const result = await pool
      .request()
      .input('department_id', sql.NVarChar, department_id)
      .input('category_id', sql.Int, categoryId).query(`
        SELECT
          yt.id,
          mm.measurement,
          mm.unit,
          yt.fy_target,
          yt.department_id
        FROM kpi_yearly_targets yt
        LEFT JOIN kpi_measurements mm ON yt.measurement_id = mm.id
        WHERE yt.department_id = @department_id
          AND yt.category_id = @category_id
        ORDER BY mm.id
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching measurements', error);
    res.status(500).json({ success: false, message: 'Failed to fetch measurements' });
  }
});

export default router;
