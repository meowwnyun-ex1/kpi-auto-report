/**
 * KPI Management - Monthly Target Routes
 * Pool allocation and approval flow
 */

import express from 'express';
import sql from 'mssql';
import { getKpiDb } from '../config/database';
import { logger } from '../utils/logger';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Helper function to log approvals
const logApproval = async (
  db: sql.ConnectionPool,
  entityType: string,
  entityId: number,
  action: string,
  fromStatus: string | null,
  toStatus: string,
  approverId: number | null,
  approverRole: string | null,
  comments?: string
) => {
  try {
    await db
      .request()
      .input('entity_type', sql.NVarChar, entityType)
      .input('entity_id', sql.Int, entityId)
      .input('action', sql.NVarChar, action)
      .input('from_status', sql.NVarChar, fromStatus)
      .input('to_status', sql.NVarChar, toStatus)
      .input('approver_id', sql.Int, approverId)
      .input('approver_role', sql.NVarChar, approverRole)
      .input('comments', sql.NVarChar, comments).query(`
        INSERT INTO kpi_approval_logs 
        (entity_type, entity_id, action, from_status, to_status, approver_id, approver_role, comments, created_at)
        VALUES (@entity_type, @entity_id, @action, @from_status, @to_status, @approver_id, @approver_role, @comments, GETDATE())
      `);
  } catch (err) {
    logger.error('Failed to log approval', err);
  }
};

// Calculate remaining pool for a yearly target
const calculateRemainingPool = async (
  db: sql.ConnectionPool,
  yearlyTargetId: number
): Promise<number> => {
  const result = await db.request().input('yearly_target_id', sql.Int, yearlyTargetId).query(`
      SELECT 
        yt.target_value as total_pool,
        ISNULL(SUM(mt.allocated_value), 0) as used_pool
      FROM kpi_yearly_targets yt
      LEFT JOIN kpi_monthly_targets mt ON yt.id = mt.yearly_target_id 
        AND mt.status IN ('approved', 'hos_approved', 'hod_approved', 'pending')
      WHERE yt.id = @yearly_target_id
      GROUP BY yt.target_value
    `);

  if (result.recordset.length === 0) return 0;

  const { total_pool, used_pool } = result.recordset[0];
  return parseFloat(total_pool) - parseFloat(used_pool);
};

// ============================================
// GET /api/kpi-forms/monthly/available-yearly
// Get approved yearly targets for allocation
// ============================================
router.get('/available-yearly', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { year, department_id } = req.query;

    const db = await getKpiDb();
    const targetYear = year || new Date().getFullYear();
    const deptId = department_id || user.department_id;

    const result = await db
      .request()
      .input('year', sql.Int, parseInt(targetYear as string))
      .input('dept_id', sql.Int, deptId).query(`
        SELECT 
          yt.id,
          yt.measurement,
          yt.target_value as total_pool,
          yt.unit,
          yt.main_department_id,
          yt.related_departments,
          d.name as main_department_name,
          c.name as category_name,
          c.color as category_color
        FROM kpi_yearly_targets yt
        LEFT JOIN departments d ON yt.main_department_id = d.id
        LEFT JOIN kpi_categories c ON yt.category_id = c.id
        WHERE yt.fiscal_year = @year
        AND yt.status = 'approved'
        AND (yt.main_department_id = @dept_id OR yt.related_departments LIKE '%' + CAST(@dept_id AS NVARCHAR) + '%')
        ORDER BY yt.measurement
      `);

    // Calculate remaining pool for each target
    const targetsWithPool = await Promise.all(
      result.recordset.map(async (target: any) => {
        const remaining = await calculateRemainingPool(db, target.id);
        return { ...target, remaining_pool: remaining };
      })
    );

    res.json({ success: true, data: targetsWithPool });
  } catch (error) {
    logger.error('Error fetching available yearly targets', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available yearly targets' });
  }
});

// ============================================
// GET /api/kpi-forms/monthly/pool-status/:yearly_target_id
// Get pool allocation status
// ============================================
router.get('/pool-status/:yearly_target_id', requireAuth, async (req, res) => {
  try {
    const { yearly_target_id } = req.params;

    const db = await getKpiDb();

    // Get yearly target details
    const targetResult = await db
      .request()
      .input('id', sql.Int, parseInt(yearly_target_id as string)).query(`
        SELECT 
          yt.id,
          yt.measurement,
          yt.target_value as total_pool,
          yt.unit,
          yt.main_department_id,
          yt.related_departments,
          d.name as main_department_name
        FROM kpi_yearly_targets yt
        LEFT JOIN departments d ON yt.main_department_id = d.id
        WHERE yt.id = @id AND yt.status = 'approved'
      `);

    if (targetResult.recordset.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Yearly target not found or not approved' });
    }

    const target = targetResult.recordset[0];

    // Get all monthly allocations with department names
    const allocationsResult = await db
      .request()
      .input('yearly_target_id', sql.Int, parseInt(yearly_target_id as string)).query(`
        SELECT 
          mt.*,
          d.name as department_name,
          d.code as department_code
        FROM kpi_monthly_targets mt
        LEFT JOIN departments d ON mt.department_id = d.id
        WHERE mt.yearly_target_id = @yearly_target_id
        AND mt.status IN ('approved', 'hos_approved', 'hod_approved', 'pending')
        ORDER BY mt.month, mt.department_id
      `);

    // Calculate remaining pool
    const usedPool = allocationsResult.recordset.reduce(
      (sum: number, alloc: any) => sum + parseFloat(alloc.allocated_value),
      0
    );
    const remainingPool = parseFloat(target.total_pool) - usedPool;

    // Build month grid (April = 4 to March = 3 of next year for fiscal year)
    const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
    const monthNames = [
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
      'Jan',
      'Feb',
      'Mar',
    ];

    const monthGrid = months.map((m, idx) => {
      const allocations = allocationsResult.recordset.filter((a: any) => a.month === m);
      return {
        month: m,
        month_name: monthNames[idx],
        allocations: allocations,
        total_allocated: allocations.reduce(
          (sum: number, a: any) => sum + parseFloat(a.allocated_value),
          0
        ),
      };
    });

    res.json({
      success: true,
      data: {
        target,
        total_pool: parseFloat(target.total_pool),
        used_pool: usedPool,
        remaining_pool: remainingPool,
        allocations: allocationsResult.recordset,
        month_grid: monthGrid,
      },
    });
  } catch (error) {
    logger.error('Error fetching pool status', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pool status' });
  }
});

// ============================================
// POST /api/kpi-forms/monthly/allocate
// Allocate monthly target from pool
// ============================================
router.post('/allocate', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { yearly_target_id, department_id, month, year, allocated_value } = req.body;

    // Validate required fields
    if (!yearly_target_id || !department_id || !month || !year || !allocated_value) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const db = await getKpiDb();

    // Check remaining pool
    const remainingPool = await calculateRemainingPool(db, yearly_target_id);

    if (allocated_value > remainingPool) {
      return res.status(400).json({
        success: false,
        message: `Insufficient pool. Remaining: ${remainingPool}, Requested: ${allocated_value}`,
      });
    }

    // Check if allocation already exists for this month/department
    const existingResult = await db
      .request()
      .input('yearly_target_id', sql.Int, yearly_target_id)
      .input('department_id', sql.Int, department_id)
      .input('month', sql.Int, month)
      .input('year', sql.Int, year).query(`
        SELECT id FROM kpi_monthly_targets
        WHERE yearly_target_id = @yearly_target_id
        AND department_id = @department_id
        AND month = @month
        AND year = @year
        AND status IN ('draft', 'pending', 'hod_approved', 'hos_approved', 'approved')
      `);

    if (existingResult.recordset.length > 0) {
      // Update existing
      await db
        .request()
        .input('id', sql.Int, existingResult.recordset[0].id)
        .input('allocated_value', sql.Decimal(10, 2), allocated_value)
        .input('updated_at', sql.DateTime, new Date()).query(`
          UPDATE kpi_monthly_targets SET
            allocated_value = @allocated_value,
            updated_at = @updated_at
          WHERE id = @id
        `);

      res.json({
        success: true,
        message: 'Allocation updated',
        data: { id: existingResult.recordset[0].id },
      });
    } else {
      // Create new
      const result = await db
        .request()
        .input('yearly_target_id', sql.Int, yearly_target_id)
        .input('department_id', sql.Int, department_id)
        .input('month', sql.Int, month)
        .input('year', sql.Int, year)
        .input('allocated_value', sql.Decimal(10, 2), allocated_value)
        .input('created_by', sql.Int, user.userId).query(`
          INSERT INTO kpi_monthly_targets (
            yearly_target_id, department_id, month, year, allocated_value,
            status, created_by
          ) VALUES (
            @yearly_target_id, @department_id, @month, @year, @allocated_value,
            'draft', @created_by
          );
          SELECT SCOPE_IDENTITY() as id;
        `);

      res.json({
        success: true,
        message: 'Allocation created',
        data: { id: result.recordset[0].id },
      });
    }
  } catch (error) {
    logger.error('Error allocating monthly target', error);
    res.status(500).json({ success: false, message: 'Failed to allocate monthly target' });
  }
});

// ============================================
// GET /api/kpi-forms/monthly
// Get monthly targets with filtering
// ============================================
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { year, month, department_id, status } = req.query;

    const db = await getKpiDb();

    let query = `
      SELECT 
        mt.*,
        yt.measurement,
        yt.target_value as yearly_target_value,
        yt.unit,
        c.name as category_name,
        c.color as category_color,
        d.name as department_name,
        d.code as department_code
      FROM kpi_monthly_targets mt
      LEFT JOIN kpi_yearly_targets yt ON mt.yearly_target_id = yt.id
      LEFT JOIN kpi_categories c ON yt.category_id = c.id
      LEFT JOIN departments d ON mt.department_id = d.id
      WHERE mt.year = @year
    `;

    const request = db
      .request()
      .input('year', sql.Int, parseInt(year as string) || new Date().getFullYear());

    if (department_id) {
      query += ` AND mt.department_id = @dept_id`;
      request.input('dept_id', sql.Int, parseInt(department_id as string));
    }

    if (month) {
      query += ` AND mt.month = @month`;
      request.input('month', sql.Int, parseInt(month as string));
    }

    if (status && status !== 'all') {
      query += ` AND mt.status = @status`;
      request.input('status', sql.NVarChar, status);
    }

    query += ` ORDER BY mt.month, mt.department_id`;

    const result = await request.query(query);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching monthly targets', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monthly targets' });
  }
});

// ============================================
// POST /api/kpi-forms/monthly/submit
// Submit monthly targets for approval
// ============================================
router.post('/submit', requireAuth, async (req, res) => {
  const transaction = (await getKpiDb()).transaction();

  try {
    const user = req.user!;
    const { target_ids } = req.body;

    if (!target_ids || !Array.isArray(target_ids) || target_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No targets selected' });
    }

    await transaction.begin();

    for (const targetId of target_ids) {
      await transaction
        .request()
        .input('id', sql.Int, targetId)
        .input('submitted_by', sql.Int, user.userId).query(`
          UPDATE kpi_monthly_targets SET
            status = 'pending',
            submitted_at = GETDATE(),
            submitted_by = @submitted_by,
            updated_at = GETDATE()
          WHERE id = @id AND status = 'draft'
        `);

      await logApproval(
        transaction as any,
        'monthly_target',
        targetId,
        'submit',
        'draft',
        'pending',
        user.userId,
        null,
        undefined
      );
    }

    await transaction.commit();

    res.json({
      success: true,
      message: `${target_ids.length} monthly target(s) submitted for approval`,
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('Error submitting monthly targets', err);
    res.status(500).json({ success: false, message: 'Failed to submit monthly targets' });
  }
});

// ============================================
// DELETE /api/kpi-forms/monthly/:id
// Delete a draft monthly target
// ============================================
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const db = await getKpiDb();

    const result = await db.request().input('id', sql.Int, parseInt(id as string)).query(`
        DELETE FROM kpi_monthly_targets 
        WHERE id = @id AND status = 'draft'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Target not found or cannot be deleted (only drafts can be deleted)',
      });
    }

    res.json({ success: true, message: 'Target deleted' });
  } catch (error) {
    logger.error('Error deleting monthly target', error);
    res.status(500).json({ success: false, message: 'Failed to delete monthly target' });
  }
});

export default router;
