/**
 * KPI Management - Approval Routes
 * Multi-step approval workflow
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
// GET /api/approvals/approvers
// Get available approvers for dropdown
// ============================================
router.get('/approvers', requireAuth, async (req, res) => {
  try {
    const db = await getKpiDb();

    const result = await db.request().query(`
      SELECT id, username, full_name, role, department_id
      FROM users 
      WHERE role IN ('hod', 'hos', 'admin', 'superadmin')
      AND is_active = 1
      ORDER BY 
        CASE role 
          WHEN 'hod' THEN 1 
          WHEN 'hos' THEN 2 
          WHEN 'admin' THEN 3 
          WHEN 'superadmin' THEN 4 
        END,
        username
    `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching approvers', error);
    res.status(500).json({ success: false, message: 'Failed to fetch approvers' });
  }
});

// ============================================
// GET /api/approvals/pending
// Get all pending approvals for current user
// ============================================
router.get('/pending', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { type } = req.query;

    const db = await getKpiDb();
    const results: any = {};

    // Yearly Targets Pending Approval
    if (!type || type === 'yearly') {
      let yearlyQuery = `
        SELECT 
          yt.*,
          c.name as category_name,
          d.name as main_department_name,
          u.username as submitted_by_name
        FROM kpi_yearly_targets yt
        LEFT JOIN kpi_categories c ON yt.category_id = c.id
        LEFT JOIN departments d ON yt.main_department_id = d.id
        LEFT JOIN users u ON yt.submitted_by = u.id
        WHERE yt.status IN ('pending', 'hod_approved', 'hos_approved')
      `;

      // Filter based on user role and approval step
      const yearlyRequest = db.request();
      if (user.role === 'hod') {
        yearlyQuery += ` AND yt.status = 'pending' AND yt.main_department_id = @dept_id`;
        yearlyRequest.input('dept_id', sql.Int, user.department_id);
      } else if (user.role === 'hos') {
        yearlyQuery += ` AND yt.status = 'hod_approved'`;
      } else if (user.role === 'admin' || user.role === 'superadmin') {
        yearlyQuery += ` AND yt.status = 'hos_approved'`;
      } else {
        yearlyQuery += ` AND 1=0`; // No access for other roles
      }

      const yearlyResult = await yearlyRequest.query(yearlyQuery);
      results.yearly = yearlyResult.recordset;
    }

    // Monthly Targets Pending Approval
    if (!type || type === 'monthly') {
      let monthlyQuery = `
        SELECT 
          mt.*,
          yt.measurement,
          c.name as category_name,
          d.name as department_name,
          u.username as submitted_by_name
        FROM kpi_monthly_targets mt
        LEFT JOIN kpi_yearly_targets yt ON mt.yearly_target_id = yt.id
        LEFT JOIN kpi_categories c ON yt.category_id = c.id
        LEFT JOIN departments d ON mt.department_id = d.id
        LEFT JOIN users u ON mt.submitted_by = u.id
        WHERE mt.status IN ('pending', 'hod_approved', 'hos_approved')
      `;

      const monthlyRequest = db.request();
      if (user.role === 'hod') {
        monthlyQuery += ` AND mt.status = 'pending' AND mt.department_id = @dept_id`;
        monthlyRequest.input('dept_id', sql.Int, user.department_id);
      } else if (user.role === 'hos') {
        monthlyQuery += ` AND mt.status = 'hod_approved'`;
      } else if (user.role === 'admin' || user.role === 'superadmin') {
        monthlyQuery += ` AND mt.status = 'hos_approved'`;
      } else {
        monthlyQuery += ` AND 1=0`;
      }

      const monthlyResult = await monthlyRequest.query(monthlyQuery);
      results.monthly = monthlyResult.recordset;
    }

    // Monthly Results Pending Approval (Partial Complete declarations)
    if (!type || type === 'results') {
      let resultsQuery = `
        SELECT 
          mr.*,
          mt.month,
          mt.year,
          mt.allocated_value as target_value,
          yt.measurement,
          d.name as department_name,
          u.username as declared_by_name
        FROM kpi_monthly_results mr
        LEFT JOIN kpi_monthly_targets mt ON mr.monthly_target_id = mt.id
        LEFT JOIN kpi_yearly_targets yt ON mt.yearly_target_id = yt.id
        LEFT JOIN departments d ON mt.department_id = d.id
        LEFT JOIN users u ON mr.declared_by = u.id
        WHERE mr.status = 'pending_approval'
      `;

      const resultsRequest = db.request();
      if (user.role === 'hod') {
        resultsQuery += ` AND mt.department_id = @dept_id`;
        resultsRequest.input('dept_id', sql.Int, user.department_id);
      } else if (user.role !== 'admin' && user.role !== 'superadmin') {
        resultsQuery += ` AND 1=0`;
      }

      const resultsResult = await resultsRequest.query(resultsQuery);
      results.results = resultsResult.recordset;
    }

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Error fetching pending approvals', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending approvals' });
  }
});

// ============================================
// POST /api/approvals/yearly/:id/approve
// Approve yearly target
// ============================================
router.post('/yearly/:id/approve', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { comments } = req.body;

    const db = await getKpiDb();

    // Get current target status
    const targetResult = await db
      .request()
      .input('id', sql.Int, parseInt(id as string))
      .query(`SELECT status FROM kpi_yearly_targets WHERE id = @id`);

    if (targetResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Target not found' });
    }

    const currentStatus = targetResult.recordset[0].status;
    let newStatus = currentStatus;
    let approvalColumn = '';
    let approverRole = '';

    // Determine approval step based on current status and user role
    if (
      currentStatus === 'pending' &&
      (user.role === 'hod' || user.role === 'admin' || user.role === 'superadmin')
    ) {
      newStatus = 'hod_approved';
      approvalColumn = 'hod';
      approverRole = 'hod';
    } else if (
      currentStatus === 'hod_approved' &&
      (user.role === 'hos' || user.role === 'admin' || user.role === 'superadmin')
    ) {
      newStatus = 'hos_approved';
      approvalColumn = 'hos';
      approverRole = 'hos';
    } else if (
      currentStatus === 'hos_approved' &&
      (user.role === 'admin' || user.role === 'superadmin')
    ) {
      newStatus = 'approved';
      approvalColumn = 'admin';
      approverRole = 'admin';
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve at this step',
      });
    }

    // Update target
    await db
      .request()
      .input('id', sql.Int, parseInt(id as string))
      .input('user_id', sql.Int, user.userId)
      .input('comments', sql.NVarChar, comments).query(`
        UPDATE kpi_yearly_targets SET
          status = '${newStatus}',
          ${approvalColumn}_approved = 1,
          ${approvalColumn}_approved_by = @user_id,
          ${approvalColumn}_approved_at = GETDATE(),
          ${approvalColumn}_comments = @comments,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    // Log approval
    await logApproval(
      db,
      'yearly_target',
      parseInt(id as string),
      'approve',
      currentStatus,
      newStatus,
      user.userId,
      approverRole,
      comments
    );

    res.json({
      success: true,
      message: 'Target approved successfully',
      data: { new_status: newStatus },
    });
  } catch (error) {
    logger.error('Error approving target', error);
    res.status(500).json({ success: false, message: 'Failed to approve target' });
  }
});

// ============================================
// POST /api/approvals/yearly/:id/reject
// Reject yearly target
// ============================================
router.post('/yearly/:id/reject', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { comments } = req.body;

    if (!comments) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const db = await getKpiDb();

    // Get current target status
    const targetResult = await db
      .request()
      .input('id', sql.Int, parseInt(id as string))
      .query(`SELECT status FROM kpi_yearly_targets WHERE id = @id`);

    if (targetResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Target not found' });
    }

    const currentStatus = targetResult.recordset[0].status;

    // Only allow rejection if target is pending
    if (!['pending', 'hod_approved', 'hos_approved'].includes(currentStatus)) {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot reject target at this status' });
    }

    // Determine approver role
    let approverRole = '';
    if (user.role === 'hod') {
      approverRole = 'hod';
    } else if (user.role === 'hos') {
      approverRole = 'hos';
    } else if (user.role === 'admin' || user.role === 'superadmin') {
      approverRole = 'admin';
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized to reject' });
    }

    // Update target to rejected
    await db
      .request()
      .input('id', sql.Int, parseInt(id as string))
      .input('user_id', sql.Int, user.userId)
      .input('comments', sql.NVarChar, comments).query(`
        UPDATE kpi_yearly_targets SET
          status = 'rejected',
          ${approverRole}_approved_by = @user_id,
          ${approverRole}_approved_at = GETDATE(),
          ${approverRole}_comments = @comments,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    // Log rejection
    await logApproval(
      db,
      'yearly_target',
      parseInt(id as string),
      'reject',
      currentStatus,
      'rejected',
      user.userId,
      approverRole,
      comments
    );

    res.json({ success: true, message: 'Target rejected' });
  } catch (error) {
    logger.error('Error rejecting target', error);
    res.status(500).json({ success: false, message: 'Failed to reject target' });
  }
});

// ============================================
// POST /api/approvals/monthly/:id/approve
// Approve monthly target
// ============================================
router.post('/monthly/:id/approve', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { comments } = req.body;

    const db = await getKpiDb();

    // Get current target status
    const targetResult = await db
      .request()
      .input('id', sql.Int, parseInt(id as string))
      .query(`SELECT status FROM kpi_monthly_targets WHERE id = @id`);

    if (targetResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Target not found' });
    }

    const currentStatus = targetResult.recordset[0].status;
    let newStatus = currentStatus;
    let approvalColumn = '';
    let approverRole = '';

    // Determine approval step
    if (
      currentStatus === 'pending' &&
      (user.role === 'hod' || user.role === 'admin' || user.role === 'superadmin')
    ) {
      newStatus = 'hod_approved';
      approvalColumn = 'hod';
      approverRole = 'hod';
    } else if (
      currentStatus === 'hod_approved' &&
      (user.role === 'hos' || user.role === 'admin' || user.role === 'superadmin')
    ) {
      newStatus = 'hos_approved';
      approvalColumn = 'hos';
      approverRole = 'hos';
    } else if (
      currentStatus === 'hos_approved' &&
      (user.role === 'admin' || user.role === 'superadmin')
    ) {
      newStatus = 'approved';
      approvalColumn = 'admin';
      approverRole = 'admin';
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve at this step',
      });
    }

    // Update target
    await db
      .request()
      .input('id', sql.Int, parseInt(id as string))
      .input('user_id', sql.Int, user.userId).query(`
        UPDATE kpi_monthly_targets SET
          status = '${newStatus}',
          ${approvalColumn}_approved = 1,
          ${approvalColumn}_approved_by = @user_id,
          ${approvalColumn}_approved_at = GETDATE(),
          updated_at = GETDATE()
        WHERE id = @id
      `);

    // Log approval
    await logApproval(
      db,
      'monthly_target',
      parseInt(id as string),
      'approve',
      currentStatus,
      newStatus,
      user.userId,
      approverRole,
      comments
    );

    res.json({
      success: true,
      message: 'Monthly target approved successfully',
      data: { new_status: newStatus },
    });
  } catch (error) {
    logger.error('Error approving monthly target', error);
    res.status(500).json({ success: false, message: 'Failed to approve monthly target' });
  }
});

// ============================================
// POST /api/approvals/results/:id/approve
// Approve partial complete declaration
// ============================================
router.post('/results/:id/approve', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { comments } = req.body;

    // Only HoD or Admin can approve partial complete
    if (!['hod', 'admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const db = await getKpiDb();

    // Check if result is in pending_approval status
    const resultCheck = await db
      .request()
      .input('id', sql.Int, parseInt(id as string))
      .query(`SELECT status FROM kpi_monthly_results WHERE id = @id`);

    if (resultCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    if (resultCheck.recordset[0].status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Result is not pending approval' });
    }

    // Update result
    await db
      .request()
      .input('id', sql.Int, parseInt(id as string))
      .input('user_id', sql.Int, user.userId)
      .input('comments', sql.NVarChar, comments).query(`
        UPDATE kpi_monthly_results SET
          status = 'approved',
          approved_by = @user_id,
          approved_at = GETDATE(),
          approval_comments = @comments,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    // Log approval
    await logApproval(
      db,
      'monthly_result',
      parseInt(id as string),
      'approve',
      'pending_approval',
      'approved',
      user.userId,
      'hod',
      comments
    );

    res.json({ success: true, message: 'Result approved successfully' });
  } catch (error) {
    logger.error('Error approving result', error);
    res.status(500).json({ success: false, message: 'Failed to approve result' });
  }
});

export default router;
