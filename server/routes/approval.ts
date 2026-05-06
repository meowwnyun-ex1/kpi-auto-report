import { Router, Request, Response } from 'express';
import { getKpiDb } from '../config/database';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const logApproval = async (
  db: any,
  entityType: string,
  entityId: number,
  level: string,
  approverId: number,
  action: string,
  comments?: string
) => {
  try {
    await db
      .request()
      .input('entity_type', entityType)
      .input('entity_id', entityId)
      .input('approval_level', level)
      .input('approver_id', approverId)
      .input('action', action)
      .input('comments', comments || null)
      .query(
        `INSERT INTO kpi_approval_logs (entity_type, entity_id, approval_level, approver_id, action, comments) VALUES (@entity_type, @entity_id, @approval_level, @approver_id, @action, @comments)`
      );
  } catch (error) {
    logger.error('Failed to log approval', error);
  }
};

router.post('/yearly/:id/approve', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const { id } = req.params;
    const { level, comments } = req.body;
    const userId = (req as any).user.id;

    const target = await db
      .request()
      .input('id', parseInt(id))
      .query('SELECT * FROM kpi_yearly_targets WHERE id = @id');
    if (target.recordset.length === 0) return res.status(404).json({ error: 'Target not found' });

    const current = target.recordset[0];
    if (level === 'hos' && current.hos_approved)
      return res.status(400).json({ error: 'Already approved by HoS' });
    if (level === 'hod' && current.hod_approved)
      return res.status(400).json({ error: 'Already approved by HoD' });

    if (level === 'hos') {
      await db
        .request()
        .input('id', parseInt(id))
        .input('user_id', userId)
        .query(
          `UPDATE kpi_yearly_targets SET hos_approved = 1, hos_approved_by = @user_id, hos_approved_at = GETDATE(), approval_status = 'hos_approved' WHERE id = @id`
        );
      await logApproval(db, 'yearly_target', parseInt(id), 'hos', userId, 'approved', comments);
    } else if (level === 'hod') {
      await db
        .request()
        .input('id', parseInt(id))
        .input('user_id', userId)
        .query(
          `UPDATE kpi_yearly_targets SET hod_approved = 1, hod_approved_by = @user_id, hod_approved_at = GETDATE(), approval_status = 'approved' WHERE id = @id`
        );
      await logApproval(db, 'yearly_target', parseInt(id), 'hod', userId, 'approved', comments);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Approval error', error);
    res.status(500).json({ error: 'Approval failed' });
  }
});

router.post('/yearly/:id/reject', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const { id } = req.params;
    const { level, comments } = req.body;
    const userId = (req as any).user.id;

    await db
      .request()
      .input('id', parseInt(id))
      .query(`UPDATE kpi_yearly_targets SET approval_status = 'rejected' WHERE id = @id`);
    await logApproval(db, 'yearly_target', parseInt(id), level, userId, 'rejected', comments);
    res.json({ success: true });
  } catch (error) {
    logger.error('Reject error', error);
    res.status(500).json({ error: 'Reject failed' });
  }
});

router.post('/monthly/:id/approve', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const { id } = req.params;
    const { level, comments } = req.body;
    const userId = (req as any).user.id;

    if (level === 'hos') {
      await db
        .request()
        .input('id', parseInt(id))
        .input('user_id', userId)
        .query(
          `UPDATE kpi_monthly_targets SET hos_approved = 1, hos_approved_by = @user_id, hos_approved_at = GETDATE(), approval_status = 'hos_approved' WHERE id = @id`
        );
      await logApproval(db, 'monthly_target', parseInt(id), 'hos', userId, 'approved', comments);
    } else if (level === 'hod') {
      await db
        .request()
        .input('id', parseInt(id))
        .input('user_id', userId)
        .query(
          `UPDATE kpi_monthly_targets SET hod_approved = 1, hod_approved_by = @user_id, hod_approved_at = GETDATE(), approval_status = 'approved' WHERE id = @id`
        );
      await logApproval(db, 'monthly_target', parseInt(id), 'hod', userId, 'approved', comments);
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Monthly approval error', error);
    res.status(500).json({ error: 'Approval failed' });
  }
});

router.post('/monthly/:id/reject', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const { id } = req.params;
    const { level, comments } = req.body;
    const userId = (req as any).user.id;

    await db
      .request()
      .input('id', parseInt(id))
      .query(`UPDATE kpi_monthly_targets SET approval_status = 'rejected' WHERE id = @id`);
    await logApproval(db, 'monthly_target', parseInt(id), level, userId, 'rejected', comments);
    res.json({ success: true });
  } catch (error) {
    logger.error('Monthly reject error', error);
    res.status(500).json({ error: 'Reject failed' });
  }
});

router.post('/result/:id/approve', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const { id } = req.params;
    const { level, comments } = req.body;
    const userId = (req as any).user.id;

    if (level === 'admin') {
      await db
        .request()
        .input('id', parseInt(id))
        .input('user_id', userId)
        .query(
          `UPDATE kpi_monthly_targets SET result_admin_approved = 1, result_admin_approved_by = @user_id, result_admin_approved_at = GETDATE(), result_approval_status = 'approved' WHERE id = @id`
        );
      await logApproval(db, 'monthly_result', parseInt(id), 'admin', userId, 'approved', comments);
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Result approval error', error);
    res.status(500).json({ error: 'Approval failed' });
  }
});

// Result Declaration - Get declaration for a monthly result
router.get('/result/:id/declaration', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const { id } = req.params;
    const result = await db
      .request()
      .input('id', parseInt(id))
      .query('SELECT * FROM kpi_result_declarations WHERE monthly_result_id = @id');
    res.json(result.recordset[0] || null);
  } catch (error) {
    logger.error('Error fetching declaration', error);
    res.status(500).json({ error: 'Failed to fetch declaration' });
  }
});

// Result Declaration - Save or update declaration
router.post('/result/:id/declaration', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const { id } = req.params;
    const { declaration_text, attachment_url } = req.body;

    // Check if declaration exists
    const existing = await db
      .request()
      .input('id', parseInt(id))
      .query('SELECT id FROM kpi_result_declarations WHERE monthly_result_id = @id');

    if (existing.recordset.length > 0) {
      // Update existing
      await db
        .request()
        .input('id', parseInt(id))
        .input('declaration_text', sql.NVarChar(sql.MAX), declaration_text)
        .input('attachment_url', sql.NVarChar(500), attachment_url)
        .query(
          `UPDATE kpi_result_declarations SET declaration_text = @declaration_text, attachment_url = @attachment_url WHERE monthly_result_id = @id`
        );
    } else {
      // Insert new
      await db
        .request()
        .input('id', parseInt(id))
        .input('declaration_text', sql.NVarChar(sql.MAX), declaration_text)
        .input('attachment_url', sql.NVarChar(500), attachment_url)
        .query(
          `INSERT INTO kpi_result_declarations (monthly_result_id, declaration_text, attachment_url) VALUES (@id, @declaration_text, @attachment_url)`
        );
    }

    // Mark result as incomplete if declaration exists
    await db
      .request()
      .input('id', parseInt(id))
      .query(`UPDATE kpi_monthly_targets SET is_incomplete = 1 WHERE id = @id`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving declaration', error);
    res.status(500).json({ error: 'Failed to save declaration' });
  }
});

// Approval Route Management - Get all department approvers
router.get('/routes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const result = await db
      .request()
      .query('SELECT * FROM kpi_department_approvers ORDER BY department_name');
    res.json(result.recordset);
  } catch (error) {
    logger.error('Error fetching approval routes', error);
    res.status(500).json({ error: 'Failed to fetch approval routes' });
  }
});

// Approval Route Management - Get by department
router.get('/routes/:departmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const { departmentId } = req.params;
    const result = await db
      .request()
      .input('department_id', parseInt(departmentId))
      .query('SELECT * FROM kpi_department_approvers WHERE department_id = @department_id');
    if (result.recordset.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (error) {
    logger.error('Error fetching approval route', error);
    res.status(500).json({ error: 'Failed to fetch approval route' });
  }
});

// Approval Route Management - Create or Update
router.post('/routes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const { department_id, department_name, hos_approvers, hod_approvers } = req.body;
    const userId = (req as any).user.id;

    const existing = await db
      .request()
      .input('department_id', department_id)
      .query('SELECT id FROM kpi_department_approvers WHERE department_id = @department_id');

    if (existing.recordset.length > 0) {
      await db
        .request()
        .input('department_id', department_id)
        .input('hos_approvers', JSON.stringify(hos_approvers))
        .input('hod_approvers', JSON.stringify(hod_approvers))
        .input('updated_by', userId)
        .query(
          `UPDATE kpi_department_approvers SET hos_approvers = @hos_approvers, hod_approvers = @hod_approvers, updated_at = GETDATE() WHERE department_id = @department_id`
        );
    } else {
      await db
        .request()
        .input('department_id', department_id)
        .input('department_name', department_name)
        .input('hos_approvers', JSON.stringify(hos_approvers))
        .input('hod_approvers', JSON.stringify(hod_approvers))
        .input('created_by', userId)
        .query(
          `INSERT INTO kpi_department_approvers (department_id, department_name, hos_approvers, hod_approvers, created_by) VALUES (@department_id, @department_name, @hos_approvers, @hod_approvers, @created_by)`
        );
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving approval route', error);
    res.status(500).json({ error: 'Failed to save approval route' });
  }
});

// Approval Route Management - Deactivate
router.delete('/routes/:departmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const { departmentId } = req.params;
    await db
      .request()
      .input('department_id', parseInt(departmentId))
      .query(
        'UPDATE kpi_department_approvers SET is_active = 0 WHERE department_id = @department_id'
      );
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deactivating approval route', error);
    res.status(500).json({ error: 'Failed to deactivate approval route' });
  }
});

// Notifications - Get user notifications
router.get('/notifications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const userId = (req as any).user.id;
    const result = await db
      .request()
      .input('user_id', userId)
      .query('SELECT * FROM kpi_notifications WHERE user_id = @user_id ORDER BY created_at DESC');
    res.json(result.recordset);
  } catch (error) {
    logger.error('Error fetching notifications', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Notifications - Get unread count
router.get(
  '/notifications/unread-count',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const db = await getKpiDb();
      const userId = (req as any).user.id;
      const result = await db
        .request()
        .input('user_id', userId)
        .query(
          'SELECT COUNT(*) as count FROM kpi_notifications WHERE user_id = @user_id AND is_read = 0'
        );
      res.json({ count: result.recordset[0].count });
    } catch (error) {
      logger.error('Error fetching unread count', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  }
);

// Notifications - Mark as read
router.put('/notifications/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const { id } = req.params;
    await db
      .request()
      .input('id', parseInt(id))
      .query('UPDATE kpi_notifications SET is_read = 1 WHERE id = @id');
    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking notification as read', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Notifications - Mark all as read
router.put('/notifications/read-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getKpiDb();
    const userId = (req as any).user.id;
    await db
      .request()
      .input('user_id', userId)
      .query('UPDATE kpi_notifications SET is_read = 1 WHERE user_id = @user_id');
    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking all notifications as read', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;
