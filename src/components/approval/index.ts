/**
 * APPROVAL SYSTEM COMPONENTS
 * Export ทุก components ที่เกี่ยวกับระบบอนุมัติ
 */

// Status Badges
export {
  ApprovalStatusBadge,
  SimpleApprovalBadge,
  ApprovalStatusDot,
  ApprovalStatusWithDescription,
} from './approval-status-badge';

// Action Buttons
export {
  ApprovalActionButtons,
  CompactApprovalActions,
  ApproverLevelBadge,
} from './approval-action-buttons';

// Dialogs
export {
  ApproveDialog,
  RejectDialog,
  ReturnDialog,
  SubmitDialog,
  ApprovalHistoryDialog,
} from './approval-dialogs';

// Re-export types
export type {
  ApprovalStatus,
  ApprovalAction,
  ApprovalLevel,
  ApprovalEntityType,
  ApprovalWorkflowState,
  PendingApprovalItem,
  ApprovalLogEntry,
  ApprovalValidationResult,
  SubmitForApprovalRequest,
  ApprovalDecision,
  BulkApprovalRequest,
  BulkApprovalResult,
  ApprovalStatistics,
  ApprovalNotification,
  ApprovalDelegation,
  CreateDelegationRequest,
  ApprovalStatusConfig,
  WorkflowTransition,
  ApprovalConfig,
} from '@/shared/types/approval';

// Re-export constants
export {
  APPROVAL_STATUS_CONFIG,
  APPROVAL_LEVELS,
  APPROVAL_ACTION_LABELS,
  DEFAULT_WORKFLOW_TRANSITIONS,
  ENTITY_TYPE_CONFIG,
  APPROVAL_PERMISSIONS,
  APPROVAL_NOTIFICATION_SETTINGS,
  APPROVAL_VALIDATION_MESSAGES,
  canPerformAction,
  getStatusLabel,
  getActionLabel,
  isHigherLevel,
  getNextApprovalLevel,
} from '@/shared/constants/approval';

// Re-export hook
export { useApproval } from '@/shared/hooks/use-approval';

// Re-export service
export { ApprovalService } from '@/services/approval-service';
