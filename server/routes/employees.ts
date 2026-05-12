import express from 'express';
import { getKpiDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route GET /api/employees
 * @desc Get all employees
 * @access Private
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const db = await getKpiDb();

    const result = await db.request().query(`
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.email,
        u.role,
        u.department_id,
        d.code as department_code,
        d.name as department_name,
        u.is_active
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.is_active = 1
      ORDER BY u.full_name
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    logger.error('Error fetching employees', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
});

/**
 * @route GET /api/employees/:id
 * @desc Get employee by ID
 * @access Private
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const db = await getKpiDb();
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

    const result = await db.request().input('id', id).query(`
        SELECT 
          u.id,
          u.username,
          u.full_name,
          u.email,
          u.role,
          u.department_id,
          d.code as department_code,
          d.name as department_name,
          u.is_active
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    logger.error('Error fetching employee', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee' });
  }
});

export default router;
