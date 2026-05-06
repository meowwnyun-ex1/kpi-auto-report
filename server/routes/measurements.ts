import express, { Request, Response, NextFunction } from 'express';
import { getKpiDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { logger } from '../utils/logger';
import { DatabaseError } from '../utils/errors';

const router = express.Router();

// Category ID mapping
const CATEGORY_MAP: Record<string, number> = {
  safety: 1,
  quality: 2,
  delivery: 3,
  compliance: 4,
  hr: 5,
  attractive: 6,
  environment: 7,
  cost: 8,
};

/**
 * @route GET /api/measurements
 * @desc Get all measurements (Admin sees all, Manager sees own + related departments)
 * @access Private
 */
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, department_id, fiscal_year } = req.query;
    const db = await getKpiDb();

    logger.info('Fetching measurements', { category, department_id, fiscal_year });

    let query = `
      SELECT 
        m.id,
        m.category_id,
        m.sub_category_id,
        m.name,
        m.description,
        m.unit,
        m.unit_type,
        m.target_type,
        m.measurement,
        m.main_department_id,
        m.related_departments,
        m.main_relate,
        m.sort_order,
        m.is_active,
        m.created_at,
        m.updated_at,
        m.main_department_id as department_name,
        m.main_department_id as department_code,
        sc.name as sub_category_name
      FROM kpi_measurements m
      LEFT JOIN kpi_measurement_sub_categories sc ON m.sub_category_id = sc.id
      WHERE m.is_active = 1
    `;

    // Role-based filtering - managers see all measurements for now
    // Admin/superadmin see all, manager sees all (can be restricted later if needed)

    // Category filter
    if (category && CATEGORY_MAP[category as string]) {
      const categoryId = CATEGORY_MAP[category as string];
      logger.info('Applying category filter', { category, categoryId });
      query += ` AND m.category_id = ${categoryId}`;
    }

    // Department filter - show items where department is main OR related
    if (department_id) {
      query += ` AND (m.main_department_id = '${department_id}' OR m.related_departments LIKE '%${department_id}%' OR m.related_departments = 'ALL')`;
    }

    // Note: fiscal_year filter not applicable here — measurements are not year-specific

    query += ` ORDER BY m.category_id, m.sort_order, m.id`;

    const result = await db.request().query(query);

    logger.info('Measurements fetched', { count: result.recordset.length });

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    logger.error('Get measurements error', error);
    next(error);
  }
});

/**
 * @route GET /api/measurements/sub-categories
 * @desc Get all sub-categories for a category
 * @access Private
 */
router.get(
  '/sub-categories',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category } = req.query;
      const db = await getKpiDb();

      let query = `
        SELECT id, category_id, name, description, sort_order, is_active
        FROM kpi_measurement_sub_categories
        WHERE is_active = 1
      `;

      if (category && CATEGORY_MAP[category as string]) {
        query += ` AND category_id = ${CATEGORY_MAP[category as string]}`;
      }

      query += ` ORDER BY sort_order, name`;

      const result = await db.request().query(query);

      res.json({
        success: true,
        data: result.recordset,
      });
    } catch (error) {
      logger.error('Get sub-categories error', error);
      next(error);
    }
  }
);

/**
 * @route POST /api/measurements/sub-categories
 * @desc Create a new sub-category
 * @access Private - Admin only
 */
router.post(
  '/sub-categories',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!['admin', 'superadmin'].includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const { category_id, name, description, sort_order } = req.body;
      const db = await getKpiDb();

      const result = await db
        .request()
        .input('category_id', category_id)
        .input('name', name)
        .input('description', description || null)
        .input('sort_order', sort_order || 0).query(`
        INSERT INTO kpi_measurement_sub_categories (category_id, name, description, sort_order)
        OUTPUT INSERTED.*
        VALUES (@category_id, @name, @description, @sort_order)
      `);

      res.json({
        success: true,
        data: result.recordset[0],
        message: 'Sub-category created successfully',
      });
    } catch (error) {
      logger.error('Create sub-category error', error);
      next(error);
    }
  }
);

/**
 * @route POST /api/measurements
 * @desc Create a new measurement
 * @access Private - Admin only
 */
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      category_id,
      sub_category_id,
      name,
      description,
      unit,
      unit_type,
      target_type,
      measurement,
      main_department_id,
      related_departments,
      main_relate,
      sort_order,
    } = req.body;

    const db = await getKpiDb();

    const result = await db
      .request()
      .input('category_id', category_id)
      .input('sub_category_id', sub_category_id || null)
      .input('name', name)
      .input('description', description || null)
      .input('unit', unit || null)
      .input('unit_type', unit_type || null)
      .input('target_type', target_type || null)
      .input('measurement', measurement || null)
      .input('main_department_id', main_department_id)
      .input('related_departments', related_departments || null)
      .input('main_relate', main_relate || null)
      .input('sort_order', sort_order || 0)
      .input('created_by', req.user!.userId).query(`
        INSERT INTO kpi_measurements (
          category_id, sub_category_id, name, description,
          unit, unit_type, target_type, measurement,
          main_department_id, related_departments, main_relate,
          sort_order, created_by
        )
        OUTPUT INSERTED.*
        VALUES (
          @category_id, @sub_category_id, @name, @description,
          @unit, @unit_type, @target_type, @measurement,
          @main_department_id, @related_departments, @main_relate,
          @sort_order, @created_by
        )
      `);

    res.json({
      success: true,
      data: result.recordset[0],
      message: 'Measurement created successfully',
    });
  } catch (error) {
    logger.error('Create measurement error', error);
    next(error);
  }
});

/**
 * @route PUT /api/measurements/:id
 * @desc Update a measurement
 * @access Private - Admin only
 */
router.put('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { id } = req.params;
    const {
      category_id,
      sub_category_id,
      name,
      description,
      unit,
      unit_type,
      target_type,
      measurement,
      main_department_id,
      related_departments,
      main_relate,
      sort_order,
      is_active,
    } = req.body;

    const db = await getKpiDb();

    const result = await db
      .request()
      .input('id', id)
      .input('category_id', category_id)
      .input('sub_category_id', sub_category_id || null)
      .input('name', name)
      .input('description', description || null)
      .input('unit', unit || null)
      .input('unit_type', unit_type || null)
      .input('target_type', target_type || null)
      .input('measurement', measurement || null)
      .input('main_department_id', main_department_id)
      .input('related_departments', related_departments || null)
      .input('main_relate', main_relate || null)
      .input('sort_order', sort_order || 0)
      .input('is_active', is_active !== undefined ? is_active : true).query(`
        UPDATE kpi_measurements SET
          category_id = @category_id,
          sub_category_id = @sub_category_id,
          name = @name,
          description = @description,
          unit = @unit,
          unit_type = @unit_type,
          target_type = @target_type,
          measurement = @measurement,
          main_department_id = @main_department_id,
          related_departments = @related_departments,
          main_relate = @main_relate,
          sort_order = @sort_order,
          is_active = @is_active,
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Measurement not found' });
    }

    res.json({
      success: true,
      data: result.recordset[0],
      message: 'Measurement updated successfully',
    });
  } catch (error) {
    logger.error('Update measurement error', error);
    next(error);
  }
});

/**
 * @route DELETE /api/measurements/:id
 * @desc Soft delete a measurement (set is_active = 0)
 * @access Private - Admin only
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { id } = req.params;
    const db = await getKpiDb();

    await db.request().input('id', id).query(`
      UPDATE kpi_measurements SET is_active = 0, updated_at = GETDATE()
      WHERE id = @id
    `);

    res.json({
      success: true,
      message: 'Measurement deleted successfully',
    });
  } catch (error) {
    logger.error('Delete measurement error', error);
    next(error);
  }
});

export default router;
