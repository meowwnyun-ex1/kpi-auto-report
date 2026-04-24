/**
 * Unified Notification Hook
 * Easy-to-use notification utilities for the entire application
 */

import { useToast } from '@/hooks/use-toast';
import { 
  createNotification, 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo,
  kpiNotifications,
  userNotifications,
  NotificationType,
  NotificationCategory 
} from '@/constants/notifications';

export const useNotifications = () => {
  const { toast } = useToast();

  return {
    // Basic notification functions
    success: (category: NotificationCategory, item?: string) => 
      showSuccess(toast, category, item),
    
    error: (category: NotificationCategory, item?: string, details?: string) => 
      showError(toast, category, item, details),
    
    warning: (category: NotificationCategory, item?: string) => 
      showWarning(toast, category, item),
    
    info: (category: NotificationCategory, item?: string) => 
      showInfo(toast, category, item),

    // Custom notification
    custom: (options: {
      type: NotificationType;
      category: NotificationCategory;
      item?: string;
      details?: string;
      count?: number;
      value?: string;
      customTitle?: string;
      customDescription?: string;
    }) => toast(createNotification(options)),

    // KPI-specific notifications
    kpi: {
      targetSaved: (value: string) => kpiNotifications.targetSaved(toast, value),
      targetInvalid: (details: string) => kpiNotifications.targetInvalid(toast, details),
      quotaExceeded: (remaining: string) => kpiNotifications.quotaExceeded(toast, remaining),
      targetsDistributed: (count: number) => kpiNotifications.targetsDistributed(toast, count),
      resultSaved: () => kpiNotifications.resultSaved(toast),
    },

    // User-specific notifications
    user: {
      created: (name: string) => userNotifications.userCreated(toast, name),
      updated: (name: string) => userNotifications.userUpdated(toast, name),
      managerAssigned: (name: string) => userNotifications.managerAssigned(toast, name),
    },

    // Common operations
    save: {
      success: (item?: string) => showSuccess(toast, 'save', item),
      error: (item?: string, details?: string) => showError(toast, 'save', item, details),
    },

    delete: {
      success: (item?: string) => showSuccess(toast, 'delete', item),
      error: (item?: string, details?: string) => showError(toast, 'delete', item, details),
    },

    load: {
      error: (item?: string) => showError(toast, 'load', item),
    },

    auth: {
      success: () => showSuccess(toast, 'auth'),
      error: (type: 'invalid' | 'expired' | 'disabled') => 
        showError(toast, 'auth', 'authentication', type),
    },

    validation: {
      error: (field?: string) => showError(toast, 'validation', field),
      warning: (field?: string) => showWarning(toast, 'validation', field),
    },

    network: {
      error: () => showError(toast, 'network'),
    },

    permission: {
      denied: () => showError(toast, 'permission'),
    },

    // Direct toast access for advanced usage
    toast,
  };
};

// Export types for external use
export type { NotificationType, NotificationCategory };
