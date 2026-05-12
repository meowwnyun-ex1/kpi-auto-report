/**
 * APPROVAL SYSTEM CONSTANTS
 * ค่าคงที่สำหรับระบบอนุมัติ - ใช้ภาษาและตัวแปรที่สื่อความหมายถูกต้อง
 */

import type { ApprovalStatusConfig, ApprovalStatus, ApprovalAction, ApprovalLevel, WorkflowTransition } from '../types/approval';

// ============================================
// STATUS LABELS & CONFIGURATIONS
// ============================================

export const APPROVAL_STATUS_CONFIG: Record<ApprovalStatus, ApprovalStatusConfig> = {
  draft: {
    label: 'Draft',
    labelTh: 'ร่าง',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    icon: 'FileText',
    description: 'ยังไม่ส่งเข้าอนุมัติ',
    canEdit: true,
    canApprove: false,
    canReject: false,
    canReturn: false,
  },
  pending: {
    label: 'Pending',
    labelTh: 'รออนุมัติ',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: 'Clock',
    description: 'ส่งแล้ว รอผู้อนุมัติ',
    canEdit: false,
    canApprove: true,
    canReject: true,
    canReturn: true,
  },
  hos_reviewing: {
    label: 'HoS Reviewing',
    labelTh: 'HoS กำลังพิจารณา',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    icon: 'Search',
    description: 'Head of Section กำลังตรวจสอบ',
    canEdit: false,
    canApprove: true,
    canReject: true,
    canReturn: true,
  },
  hos_approved: {
    label: 'HoS Approved',
    labelTh: 'HoS อนุมัติแล้ว',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    icon: 'CheckCircle',
    description: 'Head of Section อนุมัติแล้ว',
    canEdit: false,
    canApprove: true,
    canReject: true,
    canReturn: true,
  },
  hos_rejected: {
    label: 'HoS Rejected',
    labelTh: 'HoS ปฏิเสธ',
    color: '#dc2626',
    bgColor: '#fee2e2',
    icon: 'XCircle',
    description: 'Head of Section ปฏิเสธ',
    canEdit: true,
    canApprove: false,
    canReject: false,
    canReturn: false,
  },
  hod_reviewing: {
    label: 'HoD Reviewing',
    labelTh: 'HoD กำลังพิจารณา',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    icon: 'Search',
    description: 'Head of Department กำลังตรวจสอบ',
    canEdit: false,
    canApprove: true,
    canReject: true,
    canReturn: true,
  },
  hod_approved: {
    label: 'HoD Approved',
    labelTh: 'HoD อนุมัติแล้ว',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    icon: 'CheckCircle',
    description: 'Head of Department อนุมัติแล้ว',
    canEdit: false,
    canApprove: true,
    canReject: true,
    canReturn: true,
  },
  hod_rejected: {
    label: 'HoD Rejected',
    labelTh: 'HoD ปฏิเสธ',
    color: '#dc2626',
    bgColor: '#fee2e2',
    icon: 'XCircle',
    description: 'Head of Department ปฏิเสธ',
    canEdit: true,
    canApprove: false,
    canReject: false,
    canReturn: false,
  },
  admin_reviewing: {
    label: 'Admin Reviewing',
    labelTh: 'Admin กำลังพิจารณา',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    icon: 'Search',
    description: 'Administrator กำลังตรวจสอบ',
    canEdit: false,
    canApprove: true,
    canReject: true,
    canReturn: true,
  },
  admin_approved: {
    label: 'Admin Approved',
    labelTh: 'Admin อนุมัติแล้ว',
    color: '#059669',
    bgColor: '#d1fae5',
    icon: 'ShieldCheck',
    description: 'Administrator อนุมัติแล้ว',
    canEdit: false,
    canApprove: false,
    canReject: false,
    canReturn: false,
  },
  admin_rejected: {
    label: 'Admin Rejected',
    labelTh: 'Admin ปฏิเสธ',
    color: '#dc2626',
    bgColor: '#fee2e2',
    icon: 'XCircle',
    description: 'Administrator ปฏิเสธ',
    canEdit: true,
    canApprove: false,
    canReject: false,
    canReturn: false,
  },
  returned: {
    label: 'Returned',
    labelTh: 'ส่งกลับให้แก้ไข',
    color: '#ea580c',
    bgColor: '#ffedd5',
    icon: 'ArrowLeft',
    description: 'ส่งกลับให้แก้ไข',
    canEdit: true,
    canApprove: false,
    canReject: false,
    canReturn: false,
  },
  cancelled: {
    label: 'Cancelled',
    labelTh: 'ยกเลิก',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    icon: 'Ban',
    description: 'ยกเลิกแล้ว',
    canEdit: false,
    canApprove: false,
    canReject: false,
    canReturn: false,
  },
};

// ============================================
// APPROVAL LEVEL CONFIGURATION
// ============================================

export const APPROVAL_LEVELS: Record<ApprovalLevel, { label: string; labelTh: string; order: number; canDelegate: boolean }> = {
  user: { label: 'User', labelTh: 'ผู้บันทึก', order: 0, canDelegate: false },
  hos: { label: 'Head of Section', labelTh: 'หัวหน้าส่วน', order: 1, canDelegate: true },
  hod: { label: 'Head of Department', labelTh: 'หัวหน้าแผนก', order: 2, canDelegate: true },
  admin: { label: 'Administrator', labelTh: 'ผู้ดูแลระบบ', order: 3, canDelegate: false },
  superadmin: { label: 'Super Admin', labelTh: 'ผู้ดูแลระบบสูงสุด', order: 4, canDelegate: false },
};

// ============================================
// APPROVAL ACTION LABELS
// ============================================

export const APPROVAL_ACTION_LABELS: Record<ApprovalAction, { label: string; labelTh: string; icon: string; color: string }> = {
  submit: { label: 'Submit', labelTh: 'ส่งเข้าอนุมัติ', icon: 'Send', color: '#3b82f6' },
  approve: { label: 'Approve', labelTh: 'อนุมัติ', icon: 'CheckCircle', color: '#10b981' },
  reject: { label: 'Reject', labelTh: 'ปฏิเสธ', icon: 'XCircle', color: '#ef4444' },
  return: { label: 'Return', labelTh: 'ส่งกลับ', icon: 'ArrowLeft', color: '#f59e0b' },
  cancel: { label: 'Cancel', labelTh: 'ยกเลิก', icon: 'Ban', color: '#6b7280' },
  resubmit: { label: 'Resubmit', labelTh: 'ส่งใหม่', icon: 'RefreshCw', color: '#3b82f6' },
  delegate: { label: 'Delegate', labelTh: 'มอบอำนาจ', icon: 'UserSwitch', color: '#8b5cf6' },
  comment: { label: 'Comment', labelTh: 'แสดงความคิดเห็น', icon: 'MessageSquare', color: '#6b7280' },
};

// ============================================
// WORKFLOW TRANSITIONS (State Machine)
// ============================================

export const DEFAULT_WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // Draft → Pending (Submit)
  { from: 'draft', to: 'pending', action: 'submit', requiredLevel: 'user' },

  // Pending → HoS Reviewing (Auto)
  { from: 'pending', to: 'hos_reviewing', action: 'submit', requiredLevel: 'hos' },

  // HoS Reviewing → HoS Approved/Rejected
  { from: 'hos_reviewing', to: 'hos_approved', action: 'approve', requiredLevel: 'hos' },
  { from: 'hos_reviewing', to: 'hos_rejected', action: 'reject', requiredLevel: 'hos' },
  { from: 'hos_reviewing', to: 'returned', action: 'return', requiredLevel: 'hos' },

  // HoS Approved → HoD Reviewing (Auto)
  { from: 'hos_approved', to: 'hod_reviewing', action: 'submit', requiredLevel: 'hod' },

  // HoD Reviewing → HoD Approved/Rejected
  { from: 'hod_reviewing', to: 'hod_approved', action: 'approve', requiredLevel: 'hod' },
  { from: 'hod_reviewing', to: 'hod_rejected', action: 'reject', requiredLevel: 'hod' },
  { from: 'hod_reviewing', to: 'returned', action: 'return', requiredLevel: 'hod' },

  // HoD Approved → Admin Reviewing (For results)
  { from: 'hod_approved', to: 'admin_reviewing', action: 'submit', requiredLevel: 'admin' },

  // Admin Reviewing → Admin Approved/Rejected
  { from: 'admin_reviewing', to: 'admin_approved', action: 'approve', requiredLevel: 'admin' },
  { from: 'admin_reviewing', to: 'admin_rejected', action: 'reject', requiredLevel: 'admin' },
  { from: 'admin_reviewing', to: 'returned', action: 'return', requiredLevel: 'admin' },

  // Returned → Draft (Auto)
  { from: 'returned', to: 'draft', action: 'cancel', requiredLevel: 'user' },

  // Rejected → Draft (Resubmit)
  { from: 'hos_rejected', to: 'draft', action: 'cancel', requiredLevel: 'user' },
  { from: 'hod_rejected', to: 'draft', action: 'cancel', requiredLevel: 'user' },
  { from: 'admin_rejected', to: 'draft', action: 'cancel', requiredLevel: 'user' },

  // Draft → Cancelled
  { from: 'draft', to: 'cancelled', action: 'cancel', requiredLevel: 'user' },
];

// ============================================
// ENTITY TYPE CONFIGURATIONS
// ============================================

export const ENTITY_TYPE_CONFIG = {
  yearly_target: {
    label: 'Yearly Target',
    labelTh: 'เป้าหมายรายปี',
    requireHoS: true,
    requireHoD: true,
    requireAdmin: false,
    approvalLevels: ['hos', 'hod'] as ApprovalLevel[],
  },
  monthly_target: {
    label: 'Monthly Target',
    labelTh: 'เป้าหมายรายเดือน',
    requireHoS: true,
    requireHoD: true,
    requireAdmin: false,
    approvalLevels: ['hos', 'hod'] as ApprovalLevel[],
  },
  monthly_result: {
    label: 'Monthly Result',
    labelTh: 'ผลลัพธ์รายเดือน',
    requireHoS: true,
    requireHoD: true,
    requireAdmin: true,
    approvalLevels: ['hos', 'hod', 'admin'] as ApprovalLevel[],
  },
  action_plan: {
    label: 'Action Plan',
    labelTh: 'แผนปฏิบัติการ',
    requireHoS: true,
    requireHoD: true,
    requireAdmin: false,
    approvalLevels: ['hos', 'hod'] as ApprovalLevel[],
  },
} as const;

// ============================================
// PERMISSIONS & ACCESS CONTROL
// ============================================

export const APPROVAL_PERMISSIONS = {
  // ใครสามารถทำ action ใดได้
  canSubmit: ['user', 'admin', 'superadmin'],
  canApprove: ['hos', 'hod', 'admin', 'superadmin'],
  canReject: ['hos', 'hod', 'admin', 'superadmin'],
  canReturn: ['hos', 'hod', 'admin', 'superadmin'],
  canCancel: ['user', 'admin', 'superadmin'],
  canDelegate: ['hos', 'hod'],
  canViewAll: ['admin', 'superadmin'],
  canBypassWorkflow: ['admin', 'superadmin'],
} as const;

// ============================================
// NOTIFICATION SETTINGS
// ============================================

export const APPROVAL_NOTIFICATION_SETTINGS = {
  enableEmail: true,
  enableInApp: true,
  reminderDays: [3, 7, 14],  // แจ้งเตือนหลังจากรอ 3, 7, 14 วัน
  overdueThreshold: 7,       // เกิน 7 วันถือว่า overdue
  dailyDigestHour: 9,        // ส่ง daily digest ตอน 9 โมง
};

// ============================================
// VALIDATION MESSAGES
// ============================================

export const APPROVAL_VALIDATION_MESSAGES = {
  en: {
    CANNOT_APPROVE_OWN: 'You cannot approve your own submission',
    ALREADY_APPROVED: 'This item has already been approved',
    ALREADY_REJECTED: 'This item has already been rejected',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
    MISSING_COMMENTS: 'Please provide comments for rejection or return',
    INVALID_STATUS_TRANSITION: 'Invalid status transition',
    REQUIRED_FIELD_MISSING: 'Required field is missing',
    DELEGATION_EXPIRED: 'Delegation has expired',
  },
  th: {
    CANNOT_APPROVE_OWN: 'ไม่สามารถอนุมัติรายการที่ตนเองส่งได้',
    ALREADY_APPROVED: 'รายการนี้ได้รับการอนุมัติแล้ว',
    ALREADY_REJECTED: 'รายการนี้ถูกปฏิเสธแล้ว',
    INSUFFICIENT_PERMISSIONS: 'คุณไม่มีสิทธิ์ดำเนินการนี้',
    MISSING_COMMENTS: 'กรุณาระบุเหตุผลสำหรับการปฏิเสธหรือส่งกลับ',
    INVALID_STATUS_TRANSITION: 'สถานะไม่ถูกต้องสำหรับการดำเนินการนี้',
    REQUIRED_FIELD_MISSING: 'กรุณากรอกข้อมูลที่จำเป็น',
    DELEGATION_EXPIRED: 'การมอบอำนาจหมดอายุแล้ว',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * ตรวจสอบว่า status ปัจจุบันสามารถทำ action ได้หรือไม่
 */
export function canPerformAction(status: ApprovalStatus, action: ApprovalAction, userLevel: ApprovalLevel): boolean {
  const config = APPROVAL_STATUS_CONFIG[status];

  switch (action) {
    case 'submit':
      return status === 'draft' || status === 'returned' || status.endsWith('_rejected');
    case 'approve':
      return config.canApprove && APPROVAL_PERMISSIONS.canApprove.includes(userLevel);
    case 'reject':
      return config.canReject && APPROVAL_PERMISSIONS.canReject.includes(userLevel);
    case 'return':
      return config.canReturn && APPROVAL_PERMISSIONS.canReturn.includes(userLevel);
    case 'cancel':
      return (status === 'draft' || status === 'pending') && APPROVAL_PERMISSIONS.canCancel.includes(userLevel);
    default:
      return false;
  }
}

/**
 * หา label ของ status ตามภาษา
 */
export function getStatusLabel(status: ApprovalStatus, language: 'en' | 'th' = 'en'): string {
  const config = APPROVAL_STATUS_CONFIG[status];
  return language === 'th' ? config.labelTh : config.label;
}

/**
 * หา label ของ action ตามภาษา
 */
export function getActionLabel(action: ApprovalAction, language: 'en' | 'th' = 'en'): string {
  const config = APPROVAL_ACTION_LABELS[action];
  return language === 'th' ? config.labelTh : config.label;
}

/**
 * ตรวจสอบลำดับการอนุมัติ (ใครมาก่อนใคร)
 */
export function isHigherLevel(level1: ApprovalLevel, level2: ApprovalLevel): boolean {
  return APPROVAL_LEVELS[level1].order > APPROVAL_LEVELS[level2].order;
}

/**
 * หา next approval level จาก status ปัจจุบัน
 */
export function getNextApprovalLevel(status: ApprovalStatus): ApprovalLevel | null {
  switch (status) {
    case 'draft':
    case 'returned':
    case 'hos_rejected':
    case 'hod_rejected':
    case 'admin_rejected':
      return 'hos';
    case 'pending':
    case 'hos_approved':
      return 'hos';
    case 'hod_approved':
      return 'admin';
    default:
      return null;
  }
}
