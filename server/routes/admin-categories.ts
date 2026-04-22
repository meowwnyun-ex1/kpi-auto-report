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

    // Fallback for development mode when database is not available
    if (process.env.NODE_ENV === 'development') {
      const mockCategories = [
        {
          id: 1,
          name: 'Safety',
          key: 'safety',
          description: 'Safety metrics',
          color: '#ef4444',
          icon: 'Shield',
          sort_order: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          name: 'Quality',
          key: 'quality',
          description: 'Quality metrics',
          color: '#3b82f6',
          icon: 'CheckCircle',
          sort_order: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 3,
          name: 'Delivery',
          key: 'delivery',
          description: 'Delivery metrics',
          color: '#10b981',
          icon: 'Truck',
          sort_order: 3,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 4,
          name: 'Cost',
          key: 'cost',
          description: 'Cost metrics',
          color: '#f59e0b',
          icon: 'DollarSign',
          sort_order: 4,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 5,
          name: 'HR',
          key: 'hr',
          description: 'HR metrics',
          color: '#8b5cf6',
          icon: 'Users',
          sort_order: 5,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 6,
          name: 'Environment',
          key: 'environment',
          description: 'Environment metrics',
          color: '#06b6d4',
          icon: 'Leaf',
          sort_order: 6,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 7,
          name: 'Compliance',
          key: 'compliance',
          description: 'Compliance metrics',
          color: '#6366f1',
          icon: 'FileText',
          sort_order: 7,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 8,
          name: 'Attractive',
          key: 'attractive',
          description: 'Attractive metrics',
          color: '#ec4899',
          icon: 'Heart',
          sort_order: 8,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      res.json({ success: true, data: mockCategories });
    } else {
      next(error);
    }
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

      // Fallback for development mode
      if (process.env.NODE_ENV === 'development') {
        const mockCategory = {
          id: Math.floor(Math.random() * 1000),
          name,
          key,
          description: description || null,
          color: color || '#6B7280',
          icon: icon || 'Tag',
          sort_order: sort_order || 0,
          is_active: is_active !== false,
          created_at: new Date(),
          updated_at: new Date(),
        };
        res.json({
          success: true,
          data: mockCategory,
          message: 'Category created (development mode)',
        });
      } else {
        next(error);
      }
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

      // Fallback for development mode
      if (process.env.NODE_ENV === 'development') {
        const mockCategory = {
          id: parseInt(req.params.id as string),
          name,
          key,
          description: description || null,
          color: color || '#6B7280',
          icon: icon || 'Tag',
          sort_order: sort_order || 0,
          is_active: is_active !== false,
          created_at: new Date(),
          updated_at: new Date(),
        };
        res.json({
          success: true,
          data: mockCategory,
          message: 'Category updated (development mode)',
        });
      } else {
        next(error);
      }
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

      // Fallback for development mode
      if (process.env.NODE_ENV === 'development') {
        res.json({ success: true, message: 'Category deleted (development mode)' });
      } else {
        next(error);
      }
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
      SELECT sc.id, sc.name, sc.key, sc.description, sc.category_id, c.name as category_name, c.key as category_key,
             sc.sort_order, sc.is_active, sc.created_at, sc.updated_at
      FROM kpi_subcategories sc
      LEFT JOIN kpi_categories c ON sc.category_id = c.id
      ORDER BY c.sort_order, sc.sort_order, sc.name
    `);

      res.json({ success: true, data: result.recordset });
    } catch (error) {
      logger.error('Error fetching subcategories:', error);

      // Fallback for development mode
      if (process.env.NODE_ENV === 'development') {
        const mockSubcategories = [
          {
            id: 1,
            name: 'Safety Training',
            key: 'safety_training',
            category_id: 1,
            category_name: 'Safety',
            category_key: 'safety',
            sort_order: 1,
            is_active: true,
          },
          {
            id: 2,
            name: 'Safety Incidents',
            key: 'safety_incidents',
            category_id: 1,
            category_name: 'Safety',
            category_key: 'safety',
            sort_order: 2,
            is_active: true,
          },
          {
            id: 3,
            name: 'Quality Control',
            key: 'quality_control',
            category_id: 2,
            category_name: 'Quality',
            category_key: 'quality',
            sort_order: 1,
            is_active: true,
          },
          {
            id: 4,
            name: 'Quality Audits',
            key: 'quality_audits',
            category_id: 2,
            category_name: 'Quality',
            category_key: 'quality',
            sort_order: 2,
            is_active: true,
          },
          {
            id: 5,
            name: 'On-time Delivery',
            key: 'on_time_delivery',
            category_id: 3,
            category_name: 'Delivery',
            category_key: 'delivery',
            sort_order: 1,
            is_active: true,
          },
          {
            id: 6,
            name: 'Delivery Accuracy',
            key: 'delivery_accuracy',
            category_id: 3,
            category_name: 'Delivery',
            category_key: 'delivery',
            sort_order: 2,
            is_active: true,
          },
          {
            id: 7,
            name: 'Labor Cost',
            key: 'labor_cost',
            category_id: 4,
            category_name: 'Cost',
            category_key: 'cost',
            sort_order: 1,
            is_active: true,
          },
          {
            id: 8,
            name: 'Material Cost',
            key: 'material_cost',
            category_id: 4,
            category_name: 'Cost',
            category_key: 'cost',
            sort_order: 2,
            is_active: true,
          },
          {
            id: 9,
            name: 'Employee Turnover',
            key: 'employee_turnover',
            category_id: 5,
            category_name: 'HR',
            category_key: 'hr',
            sort_order: 1,
            is_active: true,
          },
          {
            id: 10,
            name: 'Training Hours',
            key: 'training_hours',
            category_id: 5,
            category_name: 'HR',
            category_key: 'hr',
            sort_order: 2,
            is_active: true,
          },
          {
            id: 11,
            name: 'Waste Management',
            key: 'waste_management',
            category_id: 6,
            category_name: 'Environment',
            category_key: 'environment',
            sort_order: 1,
            is_active: true,
          },
          {
            id: 12,
            name: 'Energy Consumption',
            key: 'energy_consumption',
            category_id: 6,
            category_name: 'Environment',
            category_key: 'environment',
            sort_order: 2,
            is_active: true,
          },
          {
            id: 13,
            name: 'Regulatory Compliance',
            key: 'regulatory_compliance',
            category_id: 7,
            category_name: 'Compliance',
            category_key: 'compliance',
            sort_order: 1,
            is_active: true,
          },
          {
            id: 14,
            name: 'Internal Audits',
            key: 'internal_audits',
            category_id: 7,
            category_name: 'Compliance',
            category_key: 'compliance',
            sort_order: 2,
            is_active: true,
          },
          {
            id: 15,
            name: 'Customer Satisfaction',
            key: 'customer_satisfaction',
            category_id: 8,
            category_name: 'Attractive',
            category_key: 'attractive',
            sort_order: 1,
            is_active: true,
          },
          {
            id: 16,
            name: 'Brand Recognition',
            key: 'brand_recognition',
            category_id: 8,
            category_name: 'Attractive',
            category_key: 'attractive',
            sort_order: 2,
            is_active: true,
          },
        ];
        res.json({ success: true, data: mockSubcategories });
      } else {
        next(error);
      }
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
      SELECT m.id, m.measurement, m.unit, m.description, m.category_id, m.subcategory_id,
             c.name as category_name, c.key as category_key,
             sc.name as subcategory_name, sc.key as subcategory_key,
             m.sort_order, m.is_active, m.created_at, m.updated_at
      FROM kpi_measurements m
      LEFT JOIN kpi_categories c ON m.category_id = c.id
      LEFT JOIN kpi_subcategories sc ON m.subcategory_id = sc.id
      ORDER BY c.sort_order, sc.sort_order, m.sort_order, m.measurement
    `);

      res.json({ success: true, data: result.recordset });
    } catch (error) {
      logger.error('Error fetching measurements:', error);

      // Fallback for development mode
      if (process.env.NODE_ENV === 'development') {
        const mockMeasurements = [
          {
            id: 1,
            measurement: 'Safety Training Hours',
            unit: 'hours',
            category_id: 1,
            subcategory_id: 1,
            category_name: 'Safety',
            category_key: 'safety',
            subcategory_name: 'Safety Training',
            subcategory_key: 'safety_training',
          },
          {
            id: 2,
            measurement: 'Lost Time Injury Rate',
            unit: 'rate',
            category_id: 1,
            subcategory_id: 2,
            category_name: 'Safety',
            category_key: 'safety',
            subcategory_name: 'Safety Incidents',
            subcategory_key: 'safety_incidents',
          },
          {
            id: 3,
            measurement: 'Defect Rate',
            unit: '%',
            category_id: 2,
            subcategory_id: 3,
            category_name: 'Quality',
            category_key: 'quality',
            subcategory_name: 'Quality Control',
            subcategory_key: 'quality_control',
          },
          {
            id: 4,
            measurement: 'Audit Pass Rate',
            unit: '%',
            category_id: 2,
            subcategory_id: 4,
            category_name: 'Quality',
            category_key: 'quality',
            subcategory_name: 'Quality Audits',
            subcategory_key: 'quality_audits',
          },
          {
            id: 5,
            measurement: 'On-time Delivery Rate',
            unit: '%',
            category_id: 3,
            subcategory_id: 5,
            category_name: 'Delivery',
            category_key: 'delivery',
            subcategory_name: 'On-time Delivery',
            subcategory_key: 'on_time_delivery',
          },
          {
            id: 6,
            measurement: 'Order Accuracy Rate',
            unit: '%',
            category_id: 3,
            subcategory_id: 6,
            category_name: 'Delivery',
            category_key: 'delivery',
            subcategory_name: 'Delivery Accuracy',
            subcategory_key: 'delivery_accuracy',
          },
          {
            id: 7,
            measurement: 'Labor Cost per Unit',
            unit: 'baht',
            category_id: 4,
            subcategory_id: 7,
            category_name: 'Cost',
            category_key: 'cost',
            subcategory_name: 'Labor Cost',
            subcategory_key: 'labor_cost',
          },
          {
            id: 8,
            measurement: 'Material Cost Variance',
            unit: '%',
            category_id: 4,
            subcategory_id: 8,
            category_name: 'Cost',
            category_key: 'cost',
            subcategory_name: 'Material Cost',
            subcategory_key: 'material_cost',
          },
          {
            id: 9,
            measurement: 'Employee Turnover Rate',
            unit: '%',
            category_id: 5,
            subcategory_id: 9,
            category_name: 'HR',
            category_key: 'hr',
            subcategory_name: 'Employee Turnover',
            subcategory_key: 'employee_turnover',
          },
          {
            id: 10,
            measurement: 'Training Hours per Employee',
            unit: 'hours',
            category_id: 5,
            subcategory_id: 10,
            category_name: 'HR',
            category_key: 'hr',
            subcategory_name: 'Training Hours',
            subcategory_key: 'training_hours',
          },
          {
            id: 11,
            measurement: 'Waste Reduction Rate',
            unit: '%',
            category_id: 6,
            subcategory_id: 11,
            category_name: 'Environment',
            category_key: 'environment',
            subcategory_name: 'Waste Management',
            subcategory_key: 'waste_management',
          },
          {
            id: 12,
            measurement: 'Energy Efficiency',
            unit: 'kWh/unit',
            category_id: 6,
            subcategory_id: 12,
            category_name: 'Environment',
            category_key: 'environment',
            subcategory_name: 'Energy Consumption',
            subcategory_key: 'energy_consumption',
          },
          {
            id: 13,
            measurement: 'Compliance Rate',
            unit: '%',
            category_id: 7,
            subcategory_id: 13,
            category_name: 'Compliance',
            category_key: 'compliance',
            subcategory_name: 'Regulatory Compliance',
            subcategory_key: 'regulatory_compliance',
          },
          {
            id: 14,
            measurement: 'Internal Audit Score',
            unit: 'score',
            category_id: 7,
            subcategory_id: 14,
            category_name: 'Compliance',
            category_key: 'compliance',
            subcategory_name: 'Internal Audits',
            subcategory_key: 'internal_audits',
          },
          {
            id: 15,
            measurement: 'Customer Satisfaction Score',
            unit: 'score',
            category_id: 8,
            subcategory_id: 15,
            category_name: 'Attractive',
            category_key: 'attractive',
            subcategory_name: 'Customer Satisfaction',
            subcategory_key: 'customer_satisfaction',
          },
          {
            id: 16,
            measurement: 'Brand Awareness Index',
            unit: 'index',
            category_id: 8,
            subcategory_id: 16,
            category_name: 'Attractive',
            category_key: 'attractive',
            subcategory_name: 'Brand Recognition',
            subcategory_key: 'brand_recognition',
          },
        ];
        res.json({ success: true, data: mockMeasurements });
      } else {
        next(error);
      }
    }
  }
);

export default router;
