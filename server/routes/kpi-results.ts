/**
 * KPI Management - Monthly Result Routes
 * Result entry with source validation
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

// ============================================
// GET /api/kpi-results/sources
// Get all result sources
// ============================================
router.get('/sources', requireAuth, async (req, res) => {
  try {
    const db = await getKpiDb();

    const result = await db.request().query(`
      SELECT id, code, name FROM kpi_result_sources 
      WHERE is_active = 1 
      ORDER BY code
    `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching result sources', error);
    res.status(500).json({ success: false, message: 'Failed to fetch result sources' });
  }
});

// ============================================
// GET /api/kpi-results/available-targets
// Get approved monthly targets for result entry
// ============================================
router.get('/available-targets', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { year, month, department_id } = req.query;

    const db = await getKpiDb();

    const result = await db
      .request()
      .input('year', sql.Int, parseInt(year as string) || new Date().getFullYear())
      .input('month', sql.Int, parseInt(month as string))
      .input('dept_id', sql.Int, department_id || user.department_id).query(`
        SELECT 
          mt.id as monthly_target_id,
          mt.month,
          mt.year,
          mt.allocated_value as target_value,
          mt.department_id,
          yt.measurement,
          yt.unit,
          c.name as category_name,
          c.color as category_color,
          d.name as department_name,
          mr.id as result_id,
          mr.result_value,
          mr.status as result_status
        FROM kpi_monthly_targets mt
        LEFT JOIN kpi_yearly_targets yt ON mt.yearly_target_id = yt.id
        LEFT JOIN kpi_categories c ON yt.category_id = c.id
        LEFT JOIN departments d ON mt.department_id = d.id
        LEFT JOIN kpi_monthly_results mr ON mt.id = mr.monthly_target_id
        WHERE mt.year = @year
        AND mt.month = @month
        AND mt.department_id = @dept_id
        AND mt.status = 'approved'
        ORDER BY yt.measurement
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching available targets', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available targets' });
  }
});

// ============================================
// GET /api/kpi-results/:id/sources
// Get sources for a result
// ============================================
router.get('/:id/sources', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const db = await getKpiDb();

    const result = await db.request().input('result_id', sql.Int, parseInt(id as string)).query(`
        SELECT 
          rsl.*,
          rs.code,
          rs.name
        FROM kpi_result_source_links rsl
        LEFT JOIN kpi_result_sources rs ON rsl.source_id = rs.id
        WHERE rsl.monthly_result_id = @result_id
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching result sources', error);
    res.status(500).json({ success: false, message: 'Failed to fetch result sources' });
  }
});

// ============================================
// POST /api/kpi-results
// Create or update result with source validation
// ============================================
router.post('/', requireAuth, async (req, res) => {
  const transaction = (await getKpiDb()).transaction();

  try {
    const user = req.user!;
    const { monthly_target_id, result_value, source_ids } = req.body;

    // Validation
    if (!monthly_target_id || result_value === undefined) {
      return res
        .status(400)
        .json({ success: false, message: 'Monthly target ID and result value are required' });
    }

    // Validate: number of sources must match result value
    if (!source_ids || source_ids.length !== parseInt(result_value)) {
      return res.status(400).json({
        success: false,
        message: `Number of sources (${source_ids?.length || 0}) must match result value (${result_value})`,
      });
    }

    // Check for duplicate sources
    const uniqueSources = new Set(source_ids);
    if (uniqueSources.size !== source_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate sources are not allowed',
      });
    }

    await transaction.begin();

    // Get target value for comparison
    const targetResult = await transaction
      .request()
      .input('monthly_target_id', sql.Int, monthly_target_id)
      .query(
        `SELECT target as allocated_value FROM kpi_monthly_targets WHERE id = @monthly_target_id`
      );

    if (targetResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Monthly target not found' });
    }

    const targetValue = parseFloat(targetResult.recordset[0].allocated_value);
    const resultValue = parseFloat(result_value);

    // Determine status
    let status = 'not_entered';
    if (resultValue === targetValue) {
      status = 'full_complete';
    } else {
      status = 'partial_complete';
    }

    // Check if result already exists
    const existingResult = await transaction
      .request()
      .input('monthly_target_id', sql.Int, monthly_target_id)
      .query(`SELECT id FROM kpi_monthly_results WHERE monthly_target_id = @monthly_target_id`);

    let resultId: number;

    if (existingResult.recordset.length > 0) {
      // Update existing
      resultId = existingResult.recordset[0].id;
      await transaction
        .request()
        .input('id', sql.Int, resultId)
        .input('result_value', sql.Decimal(10, 2), result_value)
        .input('status', sql.NVarChar, status)
        .input('updated_at', sql.DateTime, new Date()).query(`
          UPDATE kpi_monthly_results SET
            result_value = @result_value,
            status = @status,
            updated_at = @updated_at
          WHERE id = @id
        `);

      // Delete old source links
      await transaction
        .request()
        .input('result_id', sql.Int, resultId)
        .query(`DELETE FROM kpi_result_source_links WHERE monthly_result_id = @result_id`);
    } else {
      // Create new
      const insertResult = await transaction
        .request()
        .input('monthly_target_id', sql.Int, monthly_target_id)
        .input('result_value', sql.Decimal(10, 2), result_value)
        .input('status', sql.NVarChar, status)
        .input('created_by', sql.Int, user.userId).query(`
          INSERT INTO kpi_monthly_results (monthly_target_id, result_value, status, created_by)
          VALUES (@monthly_target_id, @result_value, @status, @created_by);
          SELECT SCOPE_IDENTITY() as id;
        `);

      resultId = insertResult.recordset[0].id;
    }

    // Insert source links
    for (const sourceId of source_ids) {
      await transaction
        .request()
        .input('result_id', sql.Int, resultId)
        .input('source_id', sql.Int, sourceId).query(`
          INSERT INTO kpi_result_source_links (monthly_result_id, source_id)
          VALUES (@result_id, @source_id)
        `);
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Result saved successfully',
      data: {
        id: resultId,
        status,
        requires_declaration: status === 'partial_complete',
      },
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('Error saving result', err);
    res.status(500).json({ success: false, message: 'Failed to save result' });
  }
});

// ============================================
// POST /api/kpi-results/:id/declare
// Submit declaration for partial complete
// ============================================
router.post('/:id/declare', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { declaration_reason } = req.body;

    if (!declaration_reason) {
      return res.status(400).json({ success: false, message: 'Declaration reason is required' });
    }

    const db = await getKpiDb();

    const result = await db
      .request()
      .input('id', sql.Int, parseInt(id as string))
      .input('declaration_reason', sql.NVarChar, declaration_reason)
      .input('declared_by', sql.Int, user.userId).query(`
        UPDATE kpi_monthly_results SET
          status = 'pending_approval',
          declaration_reason = @declaration_reason,
          declared_by = @declared_by,
          declared_at = GETDATE(),
          updated_at = GETDATE()
        WHERE id = @id AND status = 'partial_complete'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Result not found or not in partial_complete status',
      });
    }

    await logApproval(
      db,
      'monthly_result',
      parseInt(id as string),
      'submit_declaration',
      'partial_complete',
      'pending_approval',
      user.userId,
      null,
      declaration_reason
    );

    res.json({ success: true, message: 'Declaration submitted for approval' });
  } catch (error) {
    logger.error('Error submitting declaration', error);
    res.status(500).json({ success: false, message: 'Failed to submit declaration' });
  }
});

// ============================================
// GET /api/kpi-results/pending-approval
// Get results pending HoD approval (for partial complete)
// ============================================
router.get('/pending-approval', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    const db = await getKpiDb();

    let query = `
      SELECT 
        mr.*,
        mt.month,
        mt.year,
        mt.allocated_value as target_value,
        yt.measurement,
        yt.unit,
        c.name as category_name,
        d.name as department_name,
        u.username as declared_by_name
      FROM kpi_monthly_results mr
      LEFT JOIN kpi_monthly_targets mt ON mr.monthly_target_id = mt.id
      LEFT JOIN kpi_yearly_targets yt ON mt.yearly_target_id = yt.id
      LEFT JOIN kpi_categories c ON yt.category_id = c.id
      LEFT JOIN departments d ON mt.department_id = d.id
      LEFT JOIN users u ON mr.declared_by = u.id
      WHERE mr.status = 'pending_approval'
    `;

    // If user is HoD (not admin), show only their department
    if (user.role === 'hod') {
      query += ` AND mt.department_id = @dept_id`;
    }

    query += ` ORDER BY mr.declared_at DESC`;

    const request = db.request();
    if (user.role === 'hod') {
      request.input('dept_id', sql.Int, user.department_id);
    }

    const result = await request.query(query);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching pending approvals', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending approvals' });
  }
});

// ============================================
// GET /api/kpi-results/my-results
// Get my department's results
// ============================================
router.get('/my-results', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { year, month } = req.query;

    const db = await getKpiDb();

    const result = await db
      .request()
      .input('year', sql.Int, parseInt(year as string) || new Date().getFullYear())
      .input('month', sql.Int, parseInt(month as string))
      .input('dept_id', sql.Int, user.department_id).query(`
        SELECT 
          mr.*,
          mt.month,
          mt.year,
          mt.allocated_value as target_value,
          yt.measurement,
          yt.unit,
          c.name as category_name,
          c.color as category_color,
          d.name as department_name
        FROM kpi_monthly_results mr
        LEFT JOIN kpi_monthly_targets mt ON mr.monthly_target_id = mt.id
        LEFT JOIN kpi_yearly_targets yt ON mt.yearly_target_id = yt.id
        LEFT JOIN kpi_categories c ON yt.category_id = c.id
        LEFT JOIN departments d ON mt.department_id = d.id
        WHERE mt.year = @year
        AND mt.month = @month
        AND mt.department_id = @dept_id
        ORDER BY yt.measurement
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching my results', error);
    res.status(500).json({ success: false, message: 'Failed to fetch results' });
  }
});

export default router;
