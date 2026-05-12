/**
 * KPI Management - Yearly Target Routes
 * Complete implementation with draft system and approval flow
 */

import express from 'express';
import sql from 'mssql';
import { getKpiDb, getSpoDb } from '../config/database';
import { logger } from '../utils/logger';
import { allowGuest, requireAuth, requireManager } from '../middleware/auth';

const router = express.Router();
router.use(allowGuest);

// ── Helper: load SPO dept map safely ─────────────────────────────────────────
export async function loadDeptMap(spoPool: any | null): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  if (!spoPool) return map;
  try {
    const r = await spoPool
      .request()
      .query(
        `SELECT ID as dept_id, Section_name as name_en, Company as company FROM dept_master WHERE is_active = 'Active'`
      );
    for (const d of r.recordset) map.set(d.dept_id, d);
  } catch {
    /* ignore */
  }
  return map;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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
// GET /api/kpi-forms/yearly/categories
// Get all categories with sub-categories
// ============================================
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const db = await getKpiDb();

    const result = await db.request().query(`
      SELECT 
        c.id, c.name, c.color,
        sc.id as sub_category_id, sc.name as sub_category_name
      FROM kpi_categories c
      LEFT JOIN kpi_measurement_sub_categories sc ON c.id = sc.category_id
      WHERE c.is_active = 1
      ORDER BY c.sort_order, sc.sort_order
    `);

    // Group by category
    const categories: any = {};
    result.recordset.forEach((row: any) => {
      if (!categories[row.id]) {
        categories[row.id] = {
          id: row.id,
          name: row.name,
          color: row.color,
          sub_categories: [],
        };
      }
      if (row.sub_category_id) {
        categories[row.id].sub_categories.push({
          id: row.sub_category_id,
          name: row.sub_category_name,
        });
      }
    });

    res.json({ success: true, data: Object.values(categories) });
  } catch (error) {
    logger.error('Error fetching categories', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// ============================================
// GET /api/kpi-forms/yearly/departments
// Get all departments
// ============================================
router.get('/departments', requireAuth, async (req, res) => {
  try {
    const db = await getKpiDb();

    const result = await db.request().query(`
      SELECT id, code, name FROM departments 
      WHERE is_active = 1 
      ORDER BY code
    `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching departments', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
});

// ============================================
// GET /api/kpi-forms/yearly/approvers
// Get admin users for approver selection
// ============================================
router.get('/approvers', requireAuth, async (req, res) => {
  try {
    const db = await getKpiDb();

    const result = await db.request().query(`
      SELECT id, username, full_name, role
      FROM users 
      WHERE role IN ('admin', 'superadmin', 'hod', 'hos')
      AND is_active = 1
      ORDER BY role, username
    `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching approvers', error);
    res.status(500).json({ success: false, message: 'Failed to fetch approvers' });
  }
});

// ============================================
// GET /api/kpi-v2/yearly
// Get yearly targets with filtering
// ============================================
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { year, status, department_id, category_id } = req.query;

    const db = await getKpiDb();
    let query = `
      SELECT 
        yt.*,
        c.name as category_name,
        c.color as category_color,
        sc.name as sub_category_name,
        d.name as main_department_name,
        u.username as created_by_name
      FROM kpi_yearly_targets yt
      LEFT JOIN kpi_categories c ON yt.category_id = c.id
      LEFT JOIN kpi_measurement_sub_categories sc ON yt.sub_category_id = sc.id
      LEFT JOIN departments d ON yt.main_department_id = d.id
      LEFT JOIN users u ON yt.created_by = u.id
      WHERE 1=1
    `;

    const inputs: any[] = [];

    if (year) {
      query += ` AND yt.fiscal_year = @year`;
      inputs.push({ name: 'year', type: sql.Int, value: parseInt(year as string) });
    }

    if (status && status !== 'all') {
      if (status === 'my_drafts') {
        query += ` AND yt.is_draft = 1 AND yt.created_by = @user_id`;
        inputs.push({ name: 'user_id', type: sql.Int, value: user.userId });
      } else {
        query += ` AND yt.status = @status`;
        inputs.push({ name: 'status', type: sql.NVarChar, value: status });
      }
    }

    if (department_id) {
      query += ` AND (yt.main_department_id = @dept_id OR yt.related_departments LIKE '%' + @dept_id + '%')`;
      inputs.push({ name: 'dept_id', type: sql.NVarChar, value: department_id });
    }

    if (category_id) {
      query += ` AND yt.category_id = @category_id`;
      inputs.push({ name: 'category_id', type: sql.Int, value: parseInt(category_id as string) });
    }

    query += ` ORDER BY yt.created_at DESC`;

    const request = db.request();
    inputs.forEach((input) => request.input(input.name, input.type, input.value));

    const result = await request.query(query);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    logger.error('Error fetching yearly targets', error);
    res.status(500).json({ success: false, message: 'Failed to fetch yearly targets' });
  }
});

// ============================================
// POST /api/kpi-forms/yearly/draft
// Save as draft
// ============================================
router.post('/draft', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const {
      id,
      category_id,
      sub_category_id,
      kpi_name,
      kpi_type,
      frequency,
      unit,
      target_value,
      main_department_id,
      related_department_ids,
      year,
    } = req.body;

    const db = await getKpiDb();

    if (id) {
      // Update existing draft
      await db
        .request()
        .input('id', sql.Int, id)
        .input('category_id', sql.Int, category_id)
        .input('sub_category_id', sql.Int, sub_category_id)
        .input('kpi_name', sql.NVarChar, kpi_name)
        .input('kpi_type', sql.NVarChar, kpi_type)
        .input('frequency', sql.NVarChar, frequency)
        .input('unit', sql.NVarChar, unit)
        .input('target_value', sql.Decimal(10, 2), target_value)
        .input('main_department_id', sql.Int, main_department_id)
        .input('related_department_ids', sql.NVarChar, related_department_ids?.join(','))
        .input('year', sql.Int, year || new Date().getFullYear())
        .input('updated_at', sql.DateTime, new Date())
        .input('created_by', sql.Int, user.userId).query(`
          UPDATE kpi_yearly_targets SET
            category_id = @category_id,
            sub_category_id = @sub_category_id,
            measurement = @kpi_name,
            kpi_type = @kpi_type,
            frequency = @frequency,
            unit = @unit,
            target_value = @target_value,
            main_department_id = @main_department_id,
            related_departments = @related_department_ids,
            fiscal_year = @year,
            updated_at = @updated_at
          WHERE id = @id AND is_draft = 1 AND created_by = @created_by
        `);

      res.json({ success: true, message: 'Draft updated', data: { id } });
    } else {
      // Create new draft
      const result = await db
        .request()
        .input('category_id', sql.Int, category_id)
        .input('sub_category_id', sql.Int, sub_category_id)
        .input('kpi_name', sql.NVarChar, kpi_name)
        .input('kpi_type', sql.NVarChar, kpi_type)
        .input('frequency', sql.NVarChar, frequency)
        .input('unit', sql.NVarChar, unit)
        .input('target_value', sql.Decimal(10, 2), target_value)
        .input('main_department_id', sql.Int, main_department_id)
        .input('related_department_ids', sql.NVarChar, related_department_ids?.join(','))
        .input('year', sql.Int, year || new Date().getFullYear())
        .input('created_by', sql.Int, user.userId).query(`
          INSERT INTO kpi_yearly_targets (
            category_id, sub_category_id, measurement, kpi_type, frequency, unit,
            target_value, main_department_id, related_departments, fiscal_year,
            is_draft, status, created_by
          ) VALUES (
            @category_id, @sub_category_id, @kpi_name, @kpi_type, @frequency, @unit,
            @target_value, @main_department_id, @related_department_ids, @year,
            1, 'draft', @created_by
          );
          SELECT SCOPE_IDENTITY() as id;
        `);

      res.json({ success: true, message: 'Draft saved', data: { id: result.recordset[0].id } });
    }
  } catch (error) {
    logger.error('Error saving draft', error);
    res.status(500).json({ success: false, message: 'Failed to save draft' });
  }
});

// ============================================
// POST /api/kpi-forms/yearly/submit
// Submit draft(s) for approval
// ============================================
router.post('/submit', requireAuth, async (req, res) => {
  const transaction = (await getKpiDb()).transaction();

  try {
    const user = req.user!;
    const { target_ids, approver_id } = req.body;

    if (!target_ids || !Array.isArray(target_ids) || target_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No targets selected' });
    }

    if (!approver_id) {
      return res.status(400).json({ success: false, message: 'Approver is required' });
    }

    await transaction.begin();

    for (const targetId of target_ids) {
      await transaction
        .request()
        .input('id', sql.Int, targetId)
        .input('approver_id', sql.Int, approver_id)
        .input('submitted_by', sql.Int, user.userId).query(`
          UPDATE kpi_yearly_targets SET
            status = 'pending',
            is_draft = 0,
            selected_approver_id = @approver_id,
            submitted_at = GETDATE(),
            submitted_by = @submitted_by,
            updated_at = GETDATE()
          WHERE id = @id AND is_draft = 1 AND created_by = @submitted_by
        `);

      // Log the submission
      await logApproval(
        transaction as any,
        'yearly_target',
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
      message: `${target_ids.length} target(s) submitted for approval`,
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('Error submitting targets', err);
    res.status(500).json({ success: false, message: 'Failed to submit targets' });
  }
});

// ============================================
// DELETE /api/kpi-forms/yearly/draft/:id
// Delete a draft
// ============================================
router.delete('/draft/:id', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const db = await getKpiDb();

    const result = await db
      .request()
      .input('id', sql.Int, parseInt(id as string))
      .input('created_by', sql.Int, user.userId).query(`
        DELETE FROM kpi_yearly_targets 
        WHERE id = @id AND is_draft = 1 AND created_by = @created_by
      `);

    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Draft not found or cannot be deleted' });
    }

    res.json({ success: true, message: 'Draft deleted' });
  } catch (error) {
    logger.error('Error deleting draft', error);
    res.status(500).json({ success: false, message: 'Failed to delete draft' });
  }
});

// ============================================
// GET /api/kpi-forms/yearly/:id/approval-route
// Get approval route details
// ============================================
router.get('/:id/approval-route', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const db = await getKpiDb();

    // Get target with approval details
    const targetResult = await db.request().input('id', sql.Int, parseInt(id as string)).query(`
        SELECT 
          yt.*,
          c.name as category_name,
          d.name as main_department_name,
          cr.username as created_by_name,
          sel.username as selected_approver_name,
          hod.username as hod_approved_by_name,
          hos.username as hos_approved_by_name,
          adm.username as admin_approved_by_name
        FROM kpi_yearly_targets yt
        LEFT JOIN kpi_categories c ON yt.category_id = c.id
        LEFT JOIN departments d ON yt.main_department_id = d.id
        LEFT JOIN users cr ON yt.created_by = cr.id
        LEFT JOIN users sel ON yt.selected_approver_id = sel.id
        LEFT JOIN users hod ON yt.hod_approved_by = hod.id
        LEFT JOIN users hos ON yt.hos_approved_by = hos.id
        LEFT JOIN users adm ON yt.admin_approved_by = adm.id
        WHERE yt.id = @id
      `);

    if (targetResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Target not found' });
    }

    const target = targetResult.recordset[0];

    // Get approval logs
    const logsResult = await db.request().input('entity_id', sql.Int, parseInt(id as string))
      .query(`
        SELECT 
          al.*,
          u.username as approver_name
        FROM kpi_approval_logs al
        LEFT JOIN users u ON al.approver_id = u.id
        WHERE al.entity_type = 'yearly_target' AND al.entity_id = @entity_id
        ORDER BY al.created_at ASC
      `);

    // Build approval route steps
    const steps = [
      {
        step: 1,
        role: 'Manager',
        status: 'completed',
        name: target.created_by_name,
        at: target.created_at,
      },
      {
        step: 2,
        role: 'HoD',
        status: target.hod_approved
          ? 'completed'
          : target.status === 'pending'
            ? 'current'
            : 'pending',
        name: target.hod_approved_by_name,
        at: target.hod_approved_at,
      },
      {
        step: 3,
        role: 'HoS',
        status: target.hos_approved
          ? 'completed'
          : target.status === 'hod_approved'
            ? 'current'
            : target.hod_approved
              ? 'pending'
              : 'waiting',
        name: target.hos_approved_by_name,
        at: target.hos_approved_at,
      },
      {
        step: 4,
        role: 'Admin',
        status: target.admin_approved
          ? 'completed'
          : target.status === 'hos_approved'
            ? 'current'
            : target.hos_approved
              ? 'pending'
              : 'waiting',
        name: target.admin_approved_by_name,
        at: target.admin_approved_at,
      },
    ];

    res.json({
      success: true,
      data: {
        target,
        steps,
        logs: logsResult.recordset,
      },
    });
  } catch (error) {
    logger.error('Error fetching approval route', error);
    res.status(500).json({ success: false, message: 'Failed to fetch approval route' });
  }
});

export default router;
