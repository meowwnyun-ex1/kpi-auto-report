/**
 * Unified Notification System
 * Centralized, clear, and consistent messages for the entire application
 */

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export type NotificationCategory =
  | 'save'
  | 'delete'
  | 'load'
  | 'auth'
  | 'validation'
  | 'network'
  | 'permission'
  | 'kpi'
  | 'user'
  | 'system';

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

export const NOTIFICATION_TEMPLATES = {
  // Success Messages
  success: {
    save: {
      title: 'Saved Successfully',
      getDescription: (item?: string) =>
        item ? `${item} has been saved successfully.` : 'Data has been saved successfully.',
    },
    delete: {
      title: 'Deleted Successfully',
      getDescription: (item?: string) =>
        item ? `${item} has been deleted.` : 'Item has been deleted successfully.',
    },
    add: {
      title: 'Added Successfully',
      getDescription: (item?: string) =>
        item ? `${item} has been added successfully.` : 'New item has been added successfully.',
    },
    update: {
      title: 'Updated Successfully',
      getDescription: (item?: string) =>
        item ? `${item} has been updated successfully.` : 'Data has been updated successfully.',
    },
    auth: {
      title: 'Authentication Successful',
      getDescription: () => 'You have been signed in successfully.',
    },
    kpi: {
      target: {
        title: 'Target Set',
        getDescription: (value?: string) =>
          value ? `Target set to ${value}.` : 'Target has been set successfully.',
      },
      distributed: {
        title: 'Targets Distributed',
        getDescription: (count?: number) =>
          count
            ? `Distributed targets evenly across all months for ${count} items.`
            : 'Targets have been distributed successfully.',
      },
      result: {
        title: 'Result Saved',
        getDescription: () => 'Monthly result has been saved successfully.',
      },
    },
    user: {
      created: {
        title: 'User Created',
        getDescription: (name?: string) =>
          name ? `User ${name} has been created successfully.` : 'New user has been created.',
      },
      updated: {
        title: 'User Updated',
        getDescription: (name?: string) =>
          name ? `User ${name} has been updated.` : 'User information has been updated.',
      },
      assigned: {
        title: 'Manager Assigned',
        getDescription: (name?: string) =>
          name
            ? `${name} has been assigned as manager successfully.`
            : 'Manager has been assigned.',
      },
    },
  },

  // Error Messages
  error: {
    save: {
      title: 'Save Failed',
      getDescription: (item?: string) => `Unable to save ${item || 'data'}. Please try again.`,
    },
    delete: {
      title: 'Delete Failed',
      getDescription: (item?: string) => `Unable to delete ${item || 'item'}. Please try again.`,
    },
    load: {
      title: 'Load Failed',
      getDescription: (item?: string) => `Unable to load ${item || 'data'}. Please try again.`,
    },
    network: {
      title: 'Connection Error',
      getDescription: () =>
        'Unable to connect to the server. Please check your internet connection and try again.',
    },
    auth: {
      invalid: {
        title: 'Authentication Failed',
        getDescription: () =>
          'The username or password you entered is incorrect. Please try again.',
      },
      expired: {
        title: 'Session Expired',
        getDescription: () => 'Your session has expired. Please sign in again to continue.',
      },
      disabled: {
        title: 'Account Disabled',
        getDescription: () => 'Your account has been disabled. Please contact your administrator.',
      },
    },
    validation: {
      title: 'Validation Error',
      getDescription: (field?: string) =>
        field
          ? `Invalid ${field}. Please check and try again.`
          : 'Invalid input. Please check and try again.',
    },
    permission: {
      title: 'Access Denied',
      getDescription: () => 'You do not have permission to perform this action.',
    },
    kpi: {
      invalid: {
        title: 'Invalid Target',
        getDescription: (details?: string) =>
          details ? `Invalid target: ${details}.` : 'Target value is invalid.',
      },
      quota: {
        title: 'Quota Exceeded',
        getDescription: (remaining?: string) =>
          remaining
            ? `Target cannot exceed remaining quota of ${remaining}.`
            : 'Target exceeds available quota.',
      },
    },
    server: {
      title: 'Server Error',
      getDescription: () =>
        'The server is currently unavailable. Please try again in a few minutes.',
    },
  },

  // Warning Messages
  warning: {
    validation: {
      title: 'Validation Warning',
      getDescription: (field?: string) =>
        field ? `Please check ${field} field.` : 'Please review your input.',
    },
    unsaved: {
      title: 'Unsaved Changes',
      getDescription: () => 'You have unsaved changes. Are you sure you want to continue?',
    },
  },

  // Info Messages
  info: {
    loading: {
      title: 'Loading',
      getDescription: (item?: string) => (item ? `Loading ${item}...` : 'Loading data...'),
    },
    processing: {
      title: 'Processing',
      getDescription: () => 'Your request is being processed...',
    },
  },
} as const;

// ============================================
// NOTIFICATION UTILITIES
// ============================================

export interface NotificationOptions {
  type: NotificationType;
  category: NotificationCategory;
  item?: string;
  details?: string;
  count?: number;
  value?: string;
  customTitle?: string;
  customDescription?: string;
}

export const createNotification = (options: NotificationOptions) => {
  const { type, category, item, details, count, value, customTitle, customDescription } = options;

  // Use custom messages if provided
  if (customTitle || customDescription) {
    return {
      title: customTitle || 'Notification',
      description: customDescription || '',
      variant: type === 'error' ? ('destructive' as const) : ('default' as const),
    };
  }

  // Get template based on type and category
  const template = NOTIFICATION_TEMPLATES[type]?.[category];

  if (!template) {
    return {
      title: 'Notification',
      description: 'Operation completed.',
      variant: type === 'error' ? ('destructive' as const) : ('default' as const),
    };
  }

  // Handle nested templates (like kpi.target, auth.invalid)
  if (typeof template === 'object' && !template.getDescription) {
    const subKey = details as keyof typeof template;
    const subTemplate = template[subKey];

    if (!subTemplate || typeof subTemplate !== 'object' || !subTemplate.getDescription) {
      return {
        title: 'Notification',
        description: 'Operation completed.',
        variant: type === 'error' ? ('destructive' as const) : ('default' as const),
      };
    }

    return {
      title: subTemplate.title,
      description: subTemplate.getDescription(value || item || count?.toString()),
      variant: type === 'error' ? ('destructive' as const) : ('default' as const),
    };
  }

  // Handle direct templates
  if (template.getDescription) {
    return {
      title: template.title,
      description: template.getDescription(value || item || count?.toString()),
      variant: type === 'error' ? ('destructive' as const) : ('default' as const),
    };
  }

  return {
    title: 'Notification',
    description: 'Operation completed.',
    variant: type === 'error' ? ('destructive' as const) : ('default' as const),
  };
};

// ============================================
// COMMON NOTIFICATION HELPERS
// ============================================

export const showSuccess = (toast: any, category: NotificationCategory, item?: string) => {
  return toast(createNotification({ type: 'success', category, item }));
};

export const showError = (
  toast: any,
  category: NotificationCategory,
  item?: string,
  details?: string
) => {
  return toast(createNotification({ type: 'error', category, item, details }));
};

export const showWarning = (toast: any, category: NotificationCategory, item?: string) => {
  return toast(createNotification({ type: 'warning', category, item }));
};

export const showInfo = (toast: any, category: NotificationCategory, item?: string) => {
  return toast(createNotification({ type: 'info', category, item }));
};

// ============================================
// KPI-SPECIFIC NOTIFICATIONS
// ============================================

export const kpiNotifications = {
  targetSaved: (toast: any, value: string) =>
    toast(createNotification({ type: 'success', category: 'kpi', details: 'target', value })),

  targetInvalid: (toast: any, details: string) =>
    toast(
      createNotification({ type: 'error', category: 'kpi', details: 'invalid', value: details })
    ),

  quotaExceeded: (toast: any, remaining: string) =>
    toast(
      createNotification({ type: 'error', category: 'kpi', details: 'quota', value: remaining })
    ),

  targetsDistributed: (toast: any, count: number) =>
    toast(createNotification({ type: 'success', category: 'kpi', details: 'distributed', count })),

  resultSaved: (toast: any) =>
    toast(createNotification({ type: 'success', category: 'kpi', details: 'result' })),
};

// ============================================
// USER-SPECIFIC NOTIFICATIONS
// ============================================

export const userNotifications = {
  userCreated: (toast: any, name: string) =>
    toast(
      createNotification({ type: 'success', category: 'user', details: 'created', item: name })
    ),

  userUpdated: (toast: any, name: string) =>
    toast(
      createNotification({ type: 'success', category: 'user', details: 'updated', item: name })
    ),

  managerAssigned: (toast: any, name: string) =>
    toast(
      createNotification({ type: 'success', category: 'user', details: 'assigned', item: name })
    ),
};

// ============================================
// LEGACY COMPATIBILITY
// ============================================

// For backward compatibility, map old constants to new system
export const TOAST_MESSAGES = {
  SAVE_SUCCESS: 'Saved successfully',
  DELETE_SUCCESS: 'Deleted successfully',
  ADD_SUCCESS: 'Added successfully',
  SAVE_FAILED: 'Unable to save. Please try again.',
  DELETE_FAILED: 'Unable to delete. Please try again.',
  LOAD_FAILED: 'Unable to load data. Please try again.',
  CONNECTION_ERROR: 'Unable to connect. Please check your connection and try again.',
  ACCESS_DENIED: 'You do not have permission to perform this action.',
  INVALID_INPUT: 'Invalid input. Please check and try again.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_FORMAT: 'Invalid format. Please check and try again.',
} as const;
