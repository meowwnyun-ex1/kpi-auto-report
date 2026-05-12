/**
 * COMPREHENSIVE APPROVAL SERVICE
 * ระบบอนุมัติครบวงจร - รองรับทุก flow: submit, approve, reject, return, cancel, delegate
 */

import { ApiService } from './api-service';
import type {
  ApprovalStatus,
  ApprovalAction,
  ApprovalLevel,
  ApprovalEntityType,
  ApprovalWorkflowState,
  PendingApprovalItem,
  ApprovalDecision,
  ApprovalLogEntry,
  SubmitForApprovalRequest,
  BulkApprovalRequest,
  BulkApprovalResult,
  ApprovalStatistics,
  ApprovalNotification,
  ApprovalDelegation,
  CreateDelegationRequest,
  ApprovalValidationResult,
} from '../shared/types/approval';
import {
  APPROVAL_STATUS_CONFIG,
  APPROVAL_LEVELS,
  APPROVAL_ACTION_LABELS,
  ENTITY_TYPE_CONFIG,
  APPROVAL_PERMISSIONS,
  canPerformAction,
  getStatusLabel,
  getActionLabel,
  isHigherLevel,
  getNextApprovalLevel,
} from '../shared/constants/approval';

// ============================================
// API RESPONSE TYPES
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// APPROVAL SERVICE
// ============================================

export const ApprovalService = {
  // ============================================
  // CORE APPROVAL ACTIONS
  // ============================================

  /**
   * ส่งข้อมูลเข้าระบบอนุมัติ (Draft → Pending)
   */
  async submitForApproval(
    entityType: ApprovalEntityType,
    entityId: number,
    departmentId: string,
    fiscalYear: number,
    options?: {
      month?: number;
      comments?: string;
      attachments?: string[];
    }
  ): Promise<ApiResponse<{ id: number; status: ApprovalStatus }>> {
    const request: SubmitForApprovalRequest = {
      entityType,
      entityId,
      submittedBy: 0, // Will be set by backend from JWT
      departmentId,
      fiscalYear,
      month: options?.month,
      comments: options?.comments,
      attachments: options?.attachments,
    };

    return ApiService.post<ApiResponse<{ id: number; status: ApprovalStatus }>>(
      '/approval/submit',
      request
    );
  },

  /**
   * อนุมัติ (Approve)
   */
  async approve(
    entityType: ApprovalEntityType,
    entityId: number,
    level: ApprovalLevel,
    options?: {
      comments?: string;
      attachments?: string[];
      delegateFromId?: number;
    }
  ): Promise<ApiResponse<{ status: ApprovalStatus; approvedAt: string }>> {
    const decision: ApprovalDecision = {
      entityType,
      entityId,
      action: 'approve',
      level,
      approverId: 0, // Will be set by backend
      comments: options?.comments,
      delegateFromId: options?.delegateFromId,
      attachments: options?.attachments,
      actionAt: new Date().toISOString(),
    };

    return ApiService.post<ApiResponse<{ status: ApprovalStatus; approvedAt: string }>>(
      `/approval/${entityType}/${entityId}/approve`,
      decision
    );
  },

  /**
   * ปฏิเสธ (Reject)
   */
  async reject(
    entityType: ApprovalEntityType,
    entityId: number,
    level: ApprovalLevel,
    comments: string,
    options?: {
      attachments?: string[];
    }
  ): Promise<ApiResponse<{ status: ApprovalStatus; rejectedAt: string }>> {
    if (!comments || comments.trim().length === 0) {
      return {
        success: false,
        error: 'กรุณาระบุเหตุผลในการปฏิเสธ',
      };
    }

    const decision: ApprovalDecision = {
      entityType,
      entityId,
      action: 'reject',
      level,
      approverId: 0, // Will be set by backend
      comments,
      attachments: options?.attachments,
      actionAt: new Date().toISOString(),
    };

    return ApiService.post<ApiResponse<{ status: ApprovalStatus; rejectedAt: string }>>(
      `/approval/${entityType}/${entityId}/reject`,
      decision
    );
  },

  /**
   * ส่งกลับให้แก้ไข (Return)
   */
  async returnForChanges(
    entityType: ApprovalEntityType,
    entityId: number,
    level: ApprovalLevel,
    comments: string,
    options?: {
      requiredChanges?: string[];
    }
  ): Promise<ApiResponse<{ status: ApprovalStatus; returnedAt: string }>> {
    if (!comments || comments.trim().length === 0) {
      return {
        success: false,
        error: 'กรุณาระบุเหตุผลในการส่งกลับ',
      };
    }

    const decision: ApprovalDecision = {
      entityType,
      entityId,
      action: 'return',
      level,
      approverId: 0,
      comments,
      actionAt: new Date().toISOString(),
    };

    return ApiService.post<ApiResponse<{ status: ApprovalStatus; returnedAt: string }>>(
      `/approval/${entityType}/${entityId}/return`,
      decision
    );
  },

  /**
   * ยกเลิก (Cancel) - สำหรับผู้ส่งเท่านั้น
   */
  async cancel(
    entityType: ApprovalEntityType,
    entityId: number,
    reason?: string
  ): Promise<ApiResponse<{ status: ApprovalStatus; cancelledAt: string }>> {
    return ApiService.post<ApiResponse<{ status: ApprovalStatus; cancelledAt: string }>>(
      `/approval/${entityType}/${entityId}/cancel`,
      { reason }
    );
  },

  /**
   * ส่งใหม่อีกครั้ง (Resubmit) - หลังจากถูก reject หรือ return
   */
  async resubmit(
    entityType: ApprovalEntityType,
    entityId: number,
    changes?: string
  ): Promise<ApiResponse<{ status: ApprovalStatus; resubmittedAt: string }>> {
    return ApiService.post<ApiResponse<{ status: ApprovalStatus; resubmittedAt: string }>>(
      `/approval/${entityType}/${entityId}/resubmit`,
      { changes }
    );
  },

  // ============================================
  // BULK APPROVAL OPERATIONS
  // ============================================

  /**
   * อนุมัติหลายรายการพร้อมกัน
   */
  async bulkApprove(
    items: { entityType: ApprovalEntityType; entityId: number }[],
    level: ApprovalLevel,
    comments?: string
  ): Promise<BulkApprovalResult> {
    const request: BulkApprovalRequest = {
      items,
      action: 'approve',
      level,
      approverId: 0,
      comments,
    };

    const response = await ApiService.post<ApiResponse<BulkApprovalResult>>(
      '/approval/bulk',
      request
    );

    return (
      response.data || {
        success: false,
        processed: 0,
        approved: 0,
        rejected: 0,
        failed: items.length,
        errors: items.map((item) => ({ entityId: item.entityId, error: 'Unknown error' })),
      }
    );
  },

  /**
   * ปฏิเสธหลายรายการพร้อมกัน
   */
  async bulkReject(
    items: { entityType: ApprovalEntityType; entityId: number }[],
    level: ApprovalLevel,
    comments: string
  ): Promise<BulkApprovalResult> {
    const request: BulkApprovalRequest = {
      items,
      action: 'reject',
      level,
      approverId: 0,
      comments,
    };

    const response = await ApiService.post<ApiResponse<BulkApprovalResult>>(
      '/approval/bulk',
      request
    );

    return (
      response.data || {
        success: false,
        processed: 0,
        approved: 0,
        rejected: 0,
        failed: items.length,
        errors: items.map((item) => ({ entityId: item.entityId, error: 'Unknown error' })),
      }
    );
  },

  // ============================================
  // WORKFLOW & STATE
  // ============================================

  /**
   * ดึงสถานะ workflow ปัจจุบัน
   */
  async getWorkflowState(
    entityType: ApprovalEntityType,
    entityId: number
  ): Promise<ApprovalWorkflowState | null> {
    const response = await ApiService.get<ApiResponse<ApprovalWorkflowState>>(
      `/approval/${entityType}/${entityId}/workflow`
    );
    return response.data || null;
  },

  /**
   * ตรวจสอบว่าผู้ใช้ปัจจุบันสามารถทำ action ได้หรือไม่
   */
  async canPerformAction(
    entityType: ApprovalEntityType,
    entityId: number,
    action: ApprovalAction
  ): Promise<ApprovalValidationResult> {
    const response = await ApiService.get<ApiResponse<ApprovalValidationResult>>(
      `/approval/${entityType}/${entityId}/can-${action}`
    );
    return (
      response.data || {
        isValid: false,
        errors: ['Unable to validate'],
        warnings: [],
        canProceed: false,
      }
    );
  },

  /**
   * ดึงประวัติการอนุมัติ
   */
  async getApprovalHistory(
    entityType: ApprovalEntityType,    entityId: number
  ): Promise<ApprovalLogEntry[]> {
    const response = await ApiService.get<ApiResponse<ApprovalLogEntry[]>>(
      `/approval/${entityType}/${entityId}/history`
    );
    return response.data || [];
  },

  // ============================================
  // PENDING APPROVALS (สำหรับผู้อนุมัติ)
  // ============================================

  /**
   * ดึงรายการรออนุมัติทั้งหมดสำหรับผู้ใช้ปัจจุบัน
   */
  async getPendingApprovals(
    options?: {
      level?: ApprovalLevel;
      entityType?: ApprovalEntityType;
      departmentId?: string;
      fiscalYear?: number;
      isUrgent?: boolean;
    }
  ): Promise<PendingApprovalItem[]> {
    const params = new URLSearchParams();
    if (options?.level) params.append('level', options.level);
    if (options?.entityType) params.append('entityType', options.entityType);
    if (options?.departmentId) params.append('departmentId', options.departmentId);
    if (options?.fiscalYear) params.append('fiscalYear', options.fiscalYear.toString());
    if (options?.isUrgent) params.append('isUrgent', 'true');

    const response = await ApiService.get<ApiResponse<PendingApprovalItem[]>>(
      `/approval/pending?${params.toString()}`
    );
    return response.data || [];
  },

  /**
   * ดึงจำนวนรายการรออนุมัติ (สำหรับ badge notification)
   */
  async getPendingCount(level?: ApprovalLevel): Promise<number> {
    const params = level ? `?level=${level}` : '';
    const response = await ApiService.get<ApiResponse<{ count: number }>>(
      `/approval/pending/count${params}`
    );
    return response.data?.count || 0;
  },

  // ============================================
  // APPROVAL ROUTES (Department Approvers)
  // ============================================

  /**
   * ดึงรายการ approvers ทั้งหมด
   */
  async getApprovalRoutes(): Promise<{
    id: number;
    department_id: string;
    department_name: string;
    hos_approvers: number[];
    hod_approvers: number[];
    is_active: boolean;
  }[]> {
    const response = await ApiService.get<ApiResponse<any[]>>('/approval/routes');
    return response.data || [];
  },

  /**
   * ดึง approvers ของแผนกเฉพาะ
   */
  async getDepartmentApprovers(departmentId: string): Promise<{
    id: number;
    department_id: string;
    department_name: string;
    hos_approvers: number[];
    hod_approvers: number[];
    is_active: boolean;
  } | null> {
    const response = await ApiService.get<ApiResponse<any>>(`/approval/routes/${departmentId}`);
    return response.data || null;
  },

  /**
   * บันทึก/อัพเดต approvers ของแผนก
   */
  async saveApprovalRoute(data: {
    department_id: string;
    department_name: string;
    hos_approvers: number[];
    hod_approvers: number[];
  }): Promise<ApiResponse<void>> {
    return ApiService.post<ApiResponse<void>>('/approval/routes', data);
  },

  // ============================================
  // DELEGATION (มอบอำนาจ)
  // ============================================

  /**
   * สร้างการมอบอำนาจ
   */
  async createDelegation(
    request: CreateDelegationRequest
  ): Promise<ApiResponse<ApprovalDelegation>> {
    const response = await ApiService.post<ApiResponse<ApprovalDelegation>>(
      '/approval/delegations',
      request
    );
    return response;
  },

  /**
   * ดึงรายการมอบอำนาจที่ active
   */
  async getActiveDelegations(): Promise<ApprovalDelegation[]> {
    const response = await ApiService.get<ApiResponse<ApprovalDelegation[]>>(
      '/approval/delegations/active'
    );
    return response.data || [];
  },

  /**
   * ยกเลิกการมอบอำนาจ
   */
  async cancelDelegation(delegationId: number): Promise<ApiResponse<void>> {
    return ApiService.delete<ApiResponse<void>>(`/approval/delegations/${delegationId}`);
  },

  // ============================================
  // STATISTICS & ANALYTICS
  // ============================================

  /**
   * ดึงสถิติการอนุมัติ
   */
  async getStatistics(
    options?: {
      departmentId?: string;
      fiscalYear?: number;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<ApprovalStatistics> {
    const params = new URLSearchParams();
    if (options?.departmentId) params.append('departmentId', options.departmentId);
    if (options?.fiscalYear) params.append('fiscalYear', options.fiscalYear.toString());
    if (options?.fromDate) params.append('fromDate', options.fromDate);
    if (options?.toDate) params.append('toDate', options.toDate);

    const response = await ApiService.get<ApiResponse<ApprovalStatistics>>(
      `/approval/statistics?${params.toString()}`
    );
    return (
      response.data || {
        totalPending: 0,
        byLevel: { hos: 0, hod: 0, admin: 0 },
        byEntityType: { yearlyTarget: 0, monthlyTarget: 0, monthlyResult: 0 },
        averageApprovalTime: 0,
        overdueCount: 0,
        approvalRate: 0,
      }
    );
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================

  /**
   * ดึงการแจ้งเตือนการอนุมัติ
   */
  async getNotifications(
    options?: {
      unreadOnly?: boolean;
      limit?: number;
    }
  ): Promise<ApprovalNotification[]> {
    const params = new URLSearchParams();
    if (options?.unreadOnly) params.append('unreadOnly', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await ApiService.get<ApiResponse<ApprovalNotification[]>>(
      `/approval/notifications?${params.toString()}`
    );
    return response.data || [];
  },

  /**
   * ทำเครื่องหมายอ่านแล้ว
   */
  async markNotificationAsRead(notificationId: number): Promise<ApiResponse<void>> {
    return ApiService.post<ApiResponse<void>>(`/approval/notifications/${notificationId}/read`, {});
  },

  /**
   * ทำเครื่องหมายอ่านทั้งหมด
   */
  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    return ApiService.post<ApiResponse<void>>('/approval/notifications/read-all', {});
  },

  // ============================================
  // UTILITY METHODS (Client-side helpers)
  // ============================================

  /**
   * ตรวจสอบสิทธิ์การอนุมัติ (Client-side validation)
   */
  validatePermission(
    status: ApprovalStatus,
    action: ApprovalAction,
    userLevel: ApprovalLevel,
    options?: {
      isOwner?: boolean;
      isDelegated?: boolean;
    }
  ): ApprovalValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check basic permission
    if (!canPerformAction(status, action, userLevel)) {
      errors.push(`ไม่สามารถ${getActionLabel(action, 'th')}สถานะ${getStatusLabel(status, 'th')}ได้`);
    }

    // Check if owner trying to approve own submission
    if (action === 'approve' && options?.isOwner) {
      errors.push('ไม่สามารถอนุมัติรายการที่ตนเองส่งได้');
    }

    // Check delegation
    if (options?.isDelegated && !APPROVAL_LEVELS[userLevel].canDelegate) {
      warnings.push('การอนุมัตินี้เป็นการมอบอำนาจ');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0,
    };
  },

  /**
   * หาสีของ status สำหรับ UI
   */
  getStatusColor(status: ApprovalStatus): { color: string; bgColor: string } {
    const config = APPROVAL_STATUS_CONFIG[status];
    return {
      color: config.color,
      bgColor: config.bgColor,
    };
  },

  /**
   * หา label ของ status
   */
  getStatusDisplay(status: ApprovalStatus, language: 'en' | 'th' = 'th'): string {
    return getStatusLabel(status, language);
  },

  /**
   * หา label ของ action
   */
  getActionDisplay(action: ApprovalAction, language: 'en' | 'th' = 'th'): string {
    return getActionLabel(action, language);
  },

  /**
   * ตรวจสอบว่า status เป็น final (approved/rejected/cancelled) หรือไม่
   */
  isFinalStatus(status: ApprovalStatus): boolean {
    return ['hod_approved', 'admin_approved', 'cancelled'].includes(status);
  },

  /**
   * ตรวจสอบว่า status สามารถแก้ไขได้หรือไม่
   */
  isEditableStatus(status: ApprovalStatus): boolean {
    return APPROVAL_STATUS_CONFIG[status].canEdit;
  },

  /**
   * คำนวณจำนวนวันที่รออนุมัติ
   */
  calculatePendingDays(submittedAt: string): number {
    const submitted = new Date(submittedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * ตรวจสอบว่า overdue หรือไม่
   */
  isOverdue(submittedAt: string, thresholdDays: number = 7): boolean {
    return this.calculatePendingDays(submittedAt) > thresholdDays;
  },
};

export default ApprovalService;
