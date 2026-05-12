/**
 * APPROVAL SYSTEM TYPES
 * ระบบอนุมัติครบวงจร - ใช้ภาษาและตัวแปรที่สื่อความหมายถูกต้อง
 */

// ============================================
// APPROVAL STATUS - สถานะการอนุมัติ
// ============================================

export type ApprovalStatus =
  | 'draft'           // ร่าง - ยังไม่ส่งอนุมัติ
  | 'pending'         // รออนุมัติ - ส่งแล้วรอผู้อนุมัติ
  | 'hos_reviewing'   // HoS กำลังพิจารณา
  | 'hos_approved'    // HoS อนุมัติแล้ว
  | 'hos_rejected'    // HoS ปฏิเสธ
  | 'hod_reviewing'   // HoD กำลังพิจารณา
  | 'hod_approved'    // HoD อนุมัติแล้ว
  | 'hod_rejected'    // HoD ปฏิเสธ
  | 'admin_reviewing' // Admin กำลังพิจารณา
  | 'admin_approved'  // Admin อนุมัติแล้ว
  | 'admin_rejected'  // Admin ปฏิเสธ
  | 'returned'        // ส่งกลับให้แก้ไข
  | 'cancelled';      // ยกเลิก

// ============================================
// APPROVAL ACTIONS - การดำเนินการในระบบอนุมัติ
// ============================================

export type ApprovalAction =
  | 'submit'          // ส่งเข้าอนุมัติ
  | 'approve'         // อนุมัติ
  | 'reject'          // ปฏิเสธ
  | 'return'          // ส่งกลับให้แก้ไข
  | 'cancel'          // ยกเลิก
  | 'resubmit'        // ส่งใหม่อีกครั้ง
  | 'delegate'        // มอบอำนาจ
  | 'comment';        // แสดงความคิดเห็น

// ============================================
// APPROVAL LEVELS - ระดับการอนุมัติ
// ============================================

export type ApprovalLevel =
  | 'user'            // ผู้บันทึกข้อมูล
  | 'hos'             // Head of Section
  | 'hod'             // Head of Department
  | 'admin'           // System Administrator
  | 'superadmin';     // Super Administrator

// ============================================
// ENTITY TYPES - ประเภทเอกสารที่ต้องอนุมัติ
// ============================================

export type ApprovalEntityType =
  | 'yearly_target'   // เป้าหมายรายปี
  | 'monthly_target'  // เป้าหมายรายเดือน
  | 'monthly_result'  // ผลลัพธ์รายเดือน
  | 'action_plan'     // แผนปฏิบัติการ
  | 'revision';       // การแก้ไข/revision

// ============================================
// WORKFLOW STAGES - ขั้นตอน workflow
// ============================================

export type WorkflowStage =
  | 'entry'           // ขั้นตอนบันทึก
  | 'hos_review'      // HoS ตรวจสอบ
  | 'hod_review'      // HoD ตรวจสอบ
  | 'admin_review'    // Admin ตรวจสอบ
  | 'completed'       // เสร็จสิ้น
  | 'rejected';       // ถูกปฏิเสธ

// ============================================
// APPROVAL CONFIGURATION
// ============================================

export interface ApprovalConfig {
  entityType: ApprovalEntityType;
  requireHoS: boolean;
  requireHoD: boolean;
  requireAdmin: boolean;
  hosCanSkip: boolean;      // HoS อนุมัติข้ามได้ในกรณีพิเศษ
  allowSelfApprove: boolean; // อนุมัติตัวเองได้ (สำหรับ admin)
  allowDelegation: boolean;  // มอบอำนาจได้
  autoApproveThreshold?: number; // อนุมัติอัตโนมัติถ้าต่ำกว่า threshold
}

// ============================================
// APPROVER DEFINITION
// ============================================

export interface ApproverDefinition {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  level: ApprovalLevel;
  departmentId?: string;
  departmentName?: string;
  isDelegate?: boolean;
  delegatedBy?: number;
  delegatedAt?: string;
  delegatedUntil?: string;
}

// ============================================
// DEPARTMENT APPROVERS (จาก kpi_department_approvers)
// ============================================

export interface DepartmentApprovers {
  id: number;
  departmentId: string;
  departmentName: string;
  hosApprovers: number[];   // Array of user IDs
  hodApprovers: number[];   // Array of user IDs
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// APPROVAL REQUEST (ส่งข้อมูลเข้าอนุมัติ)
// ============================================

export interface SubmitForApprovalRequest {
  entityType: ApprovalEntityType;
  entityId: number;
  submittedBy: number;
  submittedByName?: string;
  departmentId: string;
  fiscalYear: number;
  month?: number;
  comments?: string;
  attachments?: string[];
}

// ============================================
// APPROVAL DECISION (การตัดสินใจอนุมัติ)
// ============================================

export interface ApprovalDecision {
  entityType: ApprovalEntityType;
  entityId: number;
  action: ApprovalAction;
  level: ApprovalLevel;
  approverId: number;
  approverName?: string;
  comments?: string;
  delegateFromId?: number;   // มอบอำนาจจากใคร
  attachments?: string[];
  actionAt: string;
}

// ============================================
// APPROVAL LOG ENTRY (ประวัติการอนุมัติ)
// ============================================

export interface ApprovalLogEntry {
  id: number;
  entityType: ApprovalEntityType;
  entityId: number;
  approvalLevel: ApprovalLevel;
  approverId: number;
  approverName?: string;
  action: ApprovalAction;
  previousStatus: ApprovalStatus;
  newStatus: ApprovalStatus;
  comments?: string;
  createdAt: string;
}

// ============================================
// APPROVAL WORKFLOW STATE
// ============================================

export interface ApprovalWorkflowState {
  entityType: ApprovalEntityType;
  entityId: number;
  currentStatus: ApprovalStatus;
  currentStage: WorkflowStage;
  submittedBy: number;
  submittedAt?: string;
  hosApproved: boolean;
  hosApprovedBy?: number;
  hosApprovedAt?: string;
  hosComments?: string;
  hodApproved: boolean;
  hodApprovedBy?: number;
  hodApprovedAt?: string;
  hodComments?: string;
  adminApproved: boolean;
  adminApprovedBy?: number;
  adminApprovedAt?: string;
  adminComments?: string;
  canApprove: boolean;
  canReject: boolean;
  canReturn: boolean;
  nextApproverLevel?: ApprovalLevel;
  daysInCurrentStatus: number;
  isOverdue: boolean;
}

// ============================================
// PENDING APPROVAL ITEM (รายการรออนุมัติ)
// ============================================

export interface PendingApprovalItem {
  id: number;
  entityType: ApprovalEntityType;
  entityId: number;
  title: string;
  departmentId: string;
  departmentName: string;
  categoryName?: string;
  measurement?: string;
  fiscalYear: number;
  month?: number;
  submittedBy: number;
  submittedByName: string;
  submittedAt: string;
  currentLevel: ApprovalLevel;
  status: ApprovalStatus;
  daysPending: number;
  isUrgent: boolean;
  targetValue?: number;
  resultValue?: number;
}

// ============================================
// BULK APPROVAL REQUEST
// ============================================

export interface BulkApprovalRequest {
  items: {
    entityType: ApprovalEntityType;
    entityId: number;
  }[];
  action: ApprovalAction;
  level: ApprovalLevel;
  approverId: number;
  comments?: string;
}

export interface BulkApprovalResult {
  success: boolean;
  processed: number;
  approved: number;
  rejected: number;
  failed: number;
  errors: {
    entityId: number;
    error: string;
  }[];
}

// ============================================
// APPROVAL STATISTICS
// ============================================

export interface ApprovalStatistics {
  totalPending: number;
  byLevel: {
    hos: number;
    hod: number;
    admin: number;
  };
  byEntityType: {
    yearlyTarget: number;
    monthlyTarget: number;
    monthlyResult: number;
  };
  averageApprovalTime: number;  // วัน
  overdueCount: number;
  approvalRate: number;        // %
}

// ============================================
// APPROVAL NOTIFICATION
// ============================================

export interface ApprovalNotification {
  id: number;
  recipientId: number;
  recipientEmail: string;
  type: 'submit' | 'approve' | 'reject' | 'return' | 'reminder' | 'overdue';
  entityType: ApprovalEntityType;
  entityId: number;
  title: string;
  message: string;
  actionUrl: string;
  isRead: boolean;
  createdAt: string;
  sentAt?: string;
  readAt?: string;
}

// ============================================
// APPROVAL DELEGATION
// ============================================

export interface ApprovalDelegation {
  id: number;
  delegatorId: number;
  delegatorName: string;
  delegateeId: number;
  delegateeName: string;
  level: ApprovalLevel;
  departmentId?: string;
  startDate: string;
  endDate: string;
  reason?: string;
  isActive: boolean;
  createdAt: string;
  cancelledAt?: string;
  cancelledBy?: number;
}

export interface CreateDelegationRequest {
  delegateeId: number;
  level: ApprovalLevel;
  departmentId?: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

// ============================================
// STATUS CONFIGURATION (สำหรับ UI)
// ============================================

export interface ApprovalStatusConfig {
  label: string;
  labelTh: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canReturn: boolean;
}

// ============================================
// APPROVAL WORKFLOW DEFINITION
// ============================================

export interface WorkflowTransition {
  from: ApprovalStatus;
  to: ApprovalStatus;
  action: ApprovalAction;
  requiredLevel: ApprovalLevel;
  condition?: string;
}

export interface ApprovalWorkflowDefinition {
  entityType: ApprovalEntityType;
  name: string;
  description: string;
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
  config: ApprovalConfig;
}

// ============================================
// APPROVAL VALIDATION RESULT
// ============================================

export interface ApprovalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
  suggestedAction?: ApprovalAction;
}
