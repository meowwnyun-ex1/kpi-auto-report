import express, { Request, Response, NextFunction } from 'express';
import sql from 'mssql';
import { requireAuth, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';
import { getKpiDb } from '../config/database';

const router = express.Router();

// Get all categories
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getKpiDb();
    const result = await db.request().query(`
      SELECT id, name, key, description, color, icon, sort_order, is_active, created_at, updated_at
      FROM kpi_categories
      ORDER BY sort_order, name
    `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    next(error);
  }
});

// Create category
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'superadmin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, key, description, color, icon, sort_order, is_active } = req.body;
      const db = await getKpiDb();

      // Check if key already exists
      const existing = await db
        .request()
        .input('key', sql.NVarChar(50), key)
        .query('SELECT id FROM kpi_categories WHERE key = @key');

      if (existing.recordset.length > 0) {
        return res.status(400).json({ success: false, message: 'Category key already exists' });
      }

      const result = await db
        .request()
        .input('name', sql.NVarChar(100), name)
        .input('key', sql.NVarChar(50), key)
        .input('description', sql.NVarChar(500), description || null)
        .input('color', sql.NVarChar(20), color || '#6B7280')
        .input('icon', sql.NVarChar(50), icon || 'Tag')
        .input('sort_order', sql.Int, sort_order || 0)
        .input('is_active', sql.Bit, is_active !== false).query(`
        INSERT INTO kpi_categories (name, key, description, color, icon, sort_order, is_active)
        OUTPUT INSERTED.*
        VALUES (@name, @key, @description, @color, @icon, @sort_order, @is_active)
      `);

      res.json({ success: true, data: result.recordset[0], message: 'Category created' });
    } catch (error) {
      logger.error('Error creating category:', error);
      next(error);
    }
  }
);

// Update category
router.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'superadmin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name, key, description, color, icon, sort_order, is_active } = req.body;
      const db = await getKpiDb();

      // Check if key already exists for different category
      const existing = await db
        .request()
        .input('key', sql.NVarChar(50), key)
        .input('id', sql.Int, parseInt(id))
        .query('SELECT id FROM kpi_categories WHERE key = @key AND id != @id');

      if (existing.recordset.length > 0) {
        return res.status(400).json({ success: false, message: 'Category key already exists' });
      }

      const result = await db
        .request()
        .input('id', sql.Int, parseInt(id))
        .input('name', sql.NVarChar(100), name)
        .input('key', sql.NVarChar(50), key)
        .input('description', sql.NVarChar(500), description || null)
        .input('color', sql.NVarChar(20), color || '#6B7280')
        .input('icon', sql.NVarChar(50), icon || 'Tag')
        .input('sort_order', sql.Int, sort_order || 0)
        .input('is_active', sql.Bit, is_active !== false).query(`
        UPDATE kpi_categories
        SET name = @name, key = @key, description = @description, color = @color,
            icon = @icon, sort_order = @sort_order, is_active = @is_active, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      res.json({ success: true, data: result.recordset[0], message: 'Category updated' });
    } catch (error) {
      logger.error('Error updating category:', error);
      next(error);
    }
  }
);

// Delete category
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin', 'superadmin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const db = await getKpiDb();

      // Check if category has measurements
      const measurements = await db
        .request()
        .input('category_id', sql.Int, parseInt(id))
        .query('SELECT COUNT(*) as count FROM kpi_measurements WHERE category_id = @category_id');

      if (measurements.recordset[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete: ${measurements.recordset[0].count} measurements use this category`,
        });
      }

      const result = await db
        .request()
        .input('id', sql.Int, parseInt(id))
        .query('DELETE FROM kpi_categories OUTPUT DELETED.* WHERE id = @id');

      if (result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
      logger.error('Error deleting category:', error);
      next(error);
    }
  }
);

// Get all subcategories
router.get(
  '/subcategories',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = await getKpiDb();
      const result = await db.request().query(`
      SELECT sc.id, sc.name, sc.description, sc.category_id, c.name as category_name, c.key as category_key,
             sc.sort_order, sc.is_active, sc.created_at, sc.updated_at
      FROM kpi_measurement_sub_categories sc
      LEFT JOIN kpi_categories c ON sc.category_id = c.id
      ORDER BY c.sort_order, sc.sort_order, sc.name
    `);

      res.json({ success: true, data: result.recordset });
    } catch (error) {
      logger.error('Error fetching subcategories:', error);
      next(error);
    }
  }
);

// Get all measurements
router.get(
  '/measurements',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = await getKpiDb();
      const result = await db.request().query(`
      SELECT m.id, m.measurement, m.unit, m.description, m.category_id, m.sub_category_id,
             c.name as category_name, c.key as category_key,
             sc.name as subcategory_name, sc.sort_order as subcategory_sort_order,
             m.sort_order, m.is_active, m.created_at, m.updated_at
      FROM kpi_measurements m
      LEFT JOIN kpi_categories c ON m.category_id = c.id
      LEFT JOIN kpi_measurement_sub_categories sc ON m.sub_category_id = sc.id
      ORDER BY c.sort_order, sc.sort_order, m.sort_order, m.measurement
    `);

      res.json({ success: true, data: result.recordset });
    } catch (error) {
      logger.error('Error fetching measurements:', error);
      next(error);
    }
  }
);

export default router;
