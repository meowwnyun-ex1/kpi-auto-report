/**
 * APPROVAL REACT HOOK
 * Hook สำหรับจัดการสถานะและการดำเนินการอนุมัติ
 */

import { useState, useCallback, useMemo } from 'react';
import { useToast } from './use-toast';
import ApprovalService from '../../services/approval-service';
import type {
  ApprovalStatus,
  ApprovalAction,
  ApprovalLevel,
  ApprovalEntityType,
  ApprovalWorkflowState,
  PendingApprovalItem,
  ApprovalLogEntry,
  ApprovalValidationResult,
} from '../types/approval';
import {
  APPROVAL_STATUS_CONFIG,
  canPerformAction,
  getStatusLabel,
  getActionLabel,
} from '../constants/approval';

// ============================================
// HOOK OPTIONS
// ============================================

interface UseApprovalOptions {
  entityType: ApprovalEntityType;
  entityId?: number;
  userLevel?: ApprovalLevel;
  isOwner?: boolean;
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
}

// ============================================
// HOOK RETURN TYPE
// ============================================

interface UseApprovalReturn {
  // State
  workflowState: ApprovalWorkflowState | null;
  history: ApprovalLogEntry[];
  pendingApprovals: PendingApprovalItem[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;

  // Computed
  currentStatus: ApprovalStatus | null;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canReturn: boolean;
  canCancel: boolean;
  canEdit: boolean;
  nextApproverLevel: ApprovalLevel | null;
  pendingDays: number;
  isOverdue: boolean;

  // Actions
  refresh: () => Promise<void>;
  submit: (options?: { comments?: string; attachments?: string[] }) => Promise<boolean>;
  approve: (level: ApprovalLevel, options?: { comments?: string }) => Promise<boolean>;
  reject: (level: ApprovalLevel, comments: string) => Promise<boolean>;
  returnForChanges: (level: ApprovalLevel, comments: string) => Promise<boolean>;
  cancel: (reason?: string) => Promise<boolean>;
  resubmit: (changes?: string) => Promise<boolean>;
  loadHistory: () => Promise<void>;
  loadPending: (options?: {
    level?: ApprovalLevel;
    departmentId?: string;
    fiscalYear?: number;
  }) => Promise<void>;

  // Helpers
  validateAction: (action: ApprovalAction) => ApprovalValidationResult;
  getStatusDisplay: (language?: 'en' | 'th') => string;
  getStatusColor: () => { color: string; bgColor: string };
}

// ============================================
// APPROVAL HOOK
// ============================================

export function useApproval(options: UseApprovalOptions): UseApprovalReturn {
  const { toast } = useToast();
  const { entityType, entityId, userLevel = 'user', isOwner = false } = options;

  // State
  const [workflowState, setWorkflowState] = useState<ApprovalWorkflowState | null>(null);
  const [history, setHistory] = useState<ApprovalLogEntry[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // LOAD WORKFLOW STATE
  // ============================================

  const loadWorkflowState = useCallback(async () => {
    if (!entityId) return;

    setIsLoading(true);
    setError(null);

    try {
      const state = await ApprovalService.getWorkflowState(entityType, entityId);
      setWorkflowState(state);
    } catch (err) {
      setError('Failed to load workflow state');
      if (import.meta.env.DEV) {
        console.error('Load workflow error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  // ============================================
  // ACTIONS
  // ============================================

  const refresh = useCallback(async () => {
    await loadWorkflowState();
    await loadHistory();
  }, [loadWorkflowState]);

  const submit = useCallback(
    async (submitOptions?: { comments?: string; attachments?: string[] }): Promise<boolean> => {
      if (!entityId) return false;

      setIsProcessing(true);
      setError(null);

      try {
        const validation = ApprovalService.validatePermission(
          workflowState?.currentStatus || 'draft',
          'submit',
          userLevel,
          { isOwner }
        );

        if (!validation.isValid) {
          toast({
            title: 'Cannot Submit',
            description: validation.errors[0],
            variant: 'destructive',
          });
          return false;
        }

        const result = await ApprovalService.submitForApproval(
          entityType,
          entityId,
          '', // departmentId - should be passed
          0, // fiscalYear - should be passed
          submitOptions
        );

        if (result.success) {
          toast({
            title: 'Submitted',
            description: 'Item has been submitted for approval',
          });
          await refresh();
          return true;
        } else {
          toast({
            title: 'Submit Failed',
            description: result.error || 'Failed to submit',
            variant: 'destructive',
          });
          return false;
        }
      } catch (err) {
        setError('Submit failed');
        toast({
          title: 'Error',
          description: 'An error occurred while submitting',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [entityType, entityId, userLevel, isOwner, workflowState, toast, refresh]
  );

  const approve = useCallback(
    async (level: ApprovalLevel, approveOptions?: { comments?: string }): Promise<boolean> => {
      if (!entityId) return false;

      setIsProcessing(true);
      setError(null);

      try {
        const result = await ApprovalService.approve(entityType, entityId, level, approveOptions);

        if (result.success) {
          toast({
            title: 'Approved',
            description: `Item has been approved by ${level.toUpperCase()}`,
          });
          await refresh();
          return true;
        } else {
          toast({
            title: 'Approval Failed',
            description: result.error || 'Failed to approve',
            variant: 'destructive',
          });
          return false;
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'An error occurred while approving',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [entityType, entityId, toast, refresh]
  );

  const reject = useCallback(
    async (level: ApprovalLevel, comments: string): Promise<boolean> => {
      if (!entityId) return false;

      if (!comments || comments.trim().length === 0) {
        toast({
          title: 'Comment Required',
          description: 'Please provide a reason for rejection',
          variant: 'destructive',
        });
        return false;
      }

      setIsProcessing(true);

      try {
        const result = await ApprovalService.reject(entityType, entityId, level, comments);

        if (result.success) {
          toast({
            title: 'Rejected',
            description: 'Item has been rejected',
          });
          await refresh();
          return true;
        } else {
          toast({
            title: 'Reject Failed',
            description: result.error || 'Failed to reject',
            variant: 'destructive',
          });
          return false;
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'An error occurred while rejecting',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [entityType, entityId, toast, refresh]
  );

  const returnForChanges = useCallback(
    async (level: ApprovalLevel, comments: string): Promise<boolean> => {
      if (!entityId) return false;

      if (!comments || comments.trim().length === 0) {
        toast({
          title: 'Comment Required',
          description: 'Please provide a reason for returning',
          variant: 'destructive',
        });
        return false;
      }

      setIsProcessing(true);

      try {
        const result = await ApprovalService.returnForChanges(
          entityType,
          entityId,
          level,
          comments
        );

        if (result.success) {
          toast({
            title: 'Returned',
            description: 'Item has been returned for changes',
          });
          await refresh();
          return true;
        } else {
          toast({
            title: 'Return Failed',
            description: result.error || 'Failed to return',
            variant: 'destructive',
          });
          return false;
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'An error occurred while returning',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [entityType, entityId, toast, refresh]
  );

  const cancel = useCallback(
    async (reason?: string): Promise<boolean> => {
      if (!entityId) return false;

      setIsProcessing(true);

      try {
        const result = await ApprovalService.cancel(entityType, entityId, reason);

        if (result.success) {
          toast({
            title: 'Cancelled',
            description: 'Item has been cancelled',
          });
          await refresh();
          return true;
        } else {
          toast({
            title: 'Cancel Failed',
            description: result.error || 'Failed to cancel',
            variant: 'destructive',
          });
          return false;
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'An error occurred while cancelling',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [entityType, entityId, toast, refresh]
  );

  const resubmit = useCallback(
    async (changes?: string): Promise<boolean> => {
      if (!entityId) return false;

      setIsProcessing(true);

      try {
        const result = await ApprovalService.resubmit(entityType, entityId, changes);

        if (result.success) {
          toast({
            title: 'Resubmitted',
            description: 'Item has been resubmitted for approval',
          });
          await refresh();
          return true;
        } else {
          toast({
            title: 'Resubmit Failed',
            description: result.error || 'Failed to resubmit',
            variant: 'destructive',
          });
          return false;
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'An error occurred while resubmitting',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [entityType, entityId, toast, refresh]
  );

  // ============================================
  // LOAD HISTORY
  // ============================================

  const loadHistory = useCallback(async () => {
    if (!entityId) return;

    try {
      const logs = await ApprovalService.getApprovalHistory(entityType, entityId);
      setHistory(logs);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Load history error:', err);
      }
    }
  }, [entityType, entityId]);

  // ============================================
  // LOAD PENDING
  // ============================================

  const loadPending = useCallback(
    async (pendingOptions?: {
      level?: ApprovalLevel;
      departmentId?: string;
      fiscalYear?: number;
    }) => {
      try {
        const items = await ApprovalService.getPendingApprovals(pendingOptions);
        setPendingApprovals(items);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Load pending error:', err);
        }
      }
    },
    []
  );

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const currentStatus = workflowState?.currentStatus || null;

  const permissions = useMemo(() => {
    if (!currentStatus) {
      return {
        canSubmit: false,
        canApprove: false,
        canReject: false,
        canReturn: false,
        canCancel: false,
        canEdit: false,
      };
    }

    return {
      canSubmit: canPerformAction(currentStatus, 'submit', userLevel),
      canApprove: canPerformAction(currentStatus, 'approve', userLevel) && !isOwner,
      canReject: canPerformAction(currentStatus, 'reject', userLevel),
      canReturn: canPerformAction(currentStatus, 'return', userLevel),
      canCancel: canPerformAction(currentStatus, 'cancel', userLevel),
      canEdit: APPROVAL_STATUS_CONFIG[currentStatus].canEdit,
    };
  }, [currentStatus, userLevel, isOwner]);

  const nextApproverLevel = useMemo(() => {
    if (!currentStatus) return null;
    if (currentStatus === 'pending') return 'hos';
    if (currentStatus === 'hos_approved') return 'hod';
    if (currentStatus === 'hod_approved') return 'admin';
    return null;
  }, [currentStatus]);

  const pendingDays = useMemo(() => {
    if (!workflowState?.submittedAt) return 0;
    return ApprovalService.calculatePendingDays(workflowState.submittedAt);
  }, [workflowState?.submittedAt]);

  const isOverdue = useMemo(() => {
    if (!workflowState?.submittedAt) return false;
    return ApprovalService.isOverdue(workflowState.submittedAt, 7);
  }, [workflowState?.submittedAt]);

  // ============================================
  // HELPERS
  // ============================================

  const validateAction = useCallback(
    (action: ApprovalAction): ApprovalValidationResult => {
      if (!currentStatus) {
        return {
          isValid: false,
          errors: ['No workflow state available'],
          warnings: [],
          canProceed: false,
        };
      }
      return ApprovalService.validatePermission(currentStatus, action, userLevel, { isOwner });
    },
    [currentStatus, userLevel, isOwner]
  );

  const getStatusDisplay = useCallback(
    (language: 'en' | 'th' = 'th'): string => {
      if (!currentStatus) return '';
      return getStatusLabel(currentStatus, language);
    },
    [currentStatus]
  );

  const getStatusColor = useCallback(() => {
    if (!currentStatus) return { color: '#6b7280', bgColor: '#f3f4f6' };
    return ApprovalService.getStatusColor(currentStatus);
  }, [currentStatus]);

  // ============================================
  // INITIAL LOAD
  // ============================================

  // Load on mount
  // useEffect(() => {
  //   loadWorkflowState();
  // }, [loadWorkflowState]);

  // Return
  return {
    workflowState,
    history,
    pendingApprovals,
    isLoading,
    isProcessing,
    error,
    currentStatus,
    canSubmit: permissions.canSubmit,
    canApprove: permissions.canApprove,
    canReject: permissions.canReject,
    canReturn: permissions.canReturn,
    canCancel: permissions.canCancel,
    canEdit: permissions.canEdit,
    nextApproverLevel,
    pendingDays,
    isOverdue,
    refresh,
    submit,
    approve,
    reject,
    returnForChanges,
    cancel,
    resubmit,
    loadHistory,
    loadPending,
    validateAction,
    getStatusDisplay,
    getStatusColor,
  };
}

export default useApproval;
