/**
 * Enterprise KPI System - Unified Data Model
 * World-class standardized data structure for consistency
 */

// ============================================
// BASE ENTITIES
// ============================================

export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface AuditableEntity extends BaseEntity {
  createdBy?: number;
  updatedBy?: number;
  version: number;
}

// ============================================
// USER & AUTHENTICATION
// ============================================

export interface User extends BaseEntity {
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  lastLoginAt?: string;
  profileImageUrl?: string;
}

export type UserRole = 
  | 'super_admin'
  | 'admin' 
  | 'manager'
  | 'supervisor'
  | 'user'
  | 'viewer';

// ============================================
// DEPARTMENT
// ============================================

export interface Department extends BaseEntity {
  code: string;
  name: string;
  nameTh?: string;
  description?: string;
  parentId?: string;
  level: number;
  sortOrder: number;
  headOfDepartment?: string;
  contactEmail?: string;
}

// ============================================
// KPI CATEGORY
// ============================================

export interface KPICategory extends BaseEntity {
  key: string;
  name: string;
  nameTh?: string;
  description?: string;
  icon?: string;
  color?: string;
  priority: PriorityLevel;
  sortOrder: number;
  parentId?: number;
}

export type PriorityLevel = 
  | 'critical'
  | 'high' 
  | 'medium'
  | 'low'
  | 'info'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'disabled';

// ============================================
// KPI MEASUREMENT
// ============================================

export interface KPIMeasurement extends BaseEntity {
  categoryId: number;
  name: string;
  nameTh?: string;
  description?: string;
  unit: string;
  dataType: DataType;
  calculationFormula?: string;
  targetDirection: TargetDirection;
  sortOrder: number;
  mainDepartmentId?: string;
  relatedDepartmentIds?: string[];
}

export type DataType = 
  | 'number'
  | 'percentage'
  | 'currency'
  | 'count'
  | 'duration'
  | 'rating';

export type TargetDirection = 
  | 'higher_is_better'
  | 'lower_is_better'
  | 'exact_target';

// ============================================
// KPI TARGETS
// ============================================

export interface KpiYearlyTarget extends AuditableEntity {
  categoryId: number;
  measurementId: number;
  departmentId: string;
  fiscalYear: number;
  targetValue: number;
  targetText?: string;
  stretchTarget?: number;
  minimumTarget?: number;
  keyActions?: string;
  responsiblePerson?: string;
  approvalStatus: ApprovalStatus;
  hosApproved?: boolean;
  hodApproved?: boolean;
  hosApprovedBy?: number;
  hodApprovedBy?: number;
  hosApprovedAt?: string;
  hodApprovedAt?: string;
}

export interface KpiMonthlyTarget extends AuditableEntity {
  yearlyTargetId: number;
  month: number;
  targetValue: number;
  forecastValue?: number;
  approvalStatus: ApprovalStatus;
  hosApproved?: boolean;
  hodApproved?: boolean;
  hosApprovedBy?: number;
  hodApprovedBy?: number;
  hosApprovedAt?: string;
  hodApprovedAt?: string;
}

export interface KpiMonthlyResult extends AuditableEntity {
  monthlyTargetId: number;
  resultValue: number;
  achievementPercentage?: number;
  variance?: number;
  comments?: string;
  evidenceAttachments?: string[];
  declarationText?: string;
  approvalStatus: ApprovalStatus;
  hosApproved?: boolean;
  hodApproved?: boolean;
  adminApproved?: boolean;
  hosApprovedBy?: number;
  hodApprovedBy?: number;
  adminApprovedBy?: number;
  hosApprovedAt?: string;
  hodApprovedAt?: string;
  adminApprovedAt?: string;
  isIncomplete?: boolean;
}

export type ApprovalStatus = 
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'cancelled';

// ============================================
// KPI ACTION PLANS
// ============================================

export interface KpiActionPlan extends AuditableEntity {
  categoryId: number;
  measurementId?: number;
  departmentId: string;
  fiscalYear: number;
  month?: number;
  title: string;
  description?: string;
  actionItems: ActionItem[];
  responsiblePerson: string;
  targetDate: string;
  status: ActionPlanStatus;
  progressPercentage: number;
  priority: PriorityLevel;
  budgetAllocated?: number;
  budgetSpent?: number;
  remarks?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  status: ActionItemStatus;
  completedAt?: string;
}

export type ActionPlanStatus = 
  | 'not_started'
  | 'in_progress'
  | 'on_track'
  | 'at_risk'
  | 'delayed'
  | 'completed'
  | 'cancelled';

export type ActionItemStatus = 
  | 'todo'
  | 'in_progress'
  | 'completed'
  | 'blocked';

// ============================================
// KPI PERFORMANCE
// ============================================

export interface KpiPerformance {
  targetId: number;
  period: PerformancePeriod;
  actualValue: number;
  targetValue: number;
  achievementPercentage: number;
  trend: TrendDirection;
  ranking?: number;
  benchmark?: number;
}

export type PerformancePeriod = 
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'ytd';

export type TrendDirection = 
  | 'up'
  | 'down'
  | 'stable'
  | 'volatile';

// ============================================
// NOTIFICATIONS & WORKFLOW
// ============================================

export interface KpiNotification extends BaseEntity {
  userId: number;
  type: NotificationType;
  entityType: NotificationEntityType;
  entityId: number;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export type NotificationType = 
  | 'approval_required'
  | 'approval_granted'
  | 'approval_rejected'
  | 'deadline_reminder'
  | 'target_missed'
  | 'target_achieved'
  | 'action_plan_due'
  | 'system_alert';

export type NotificationEntityType = 
  | 'yearly_target'
  | 'monthly_target'
  | 'monthly_result'
  | 'action_plan'
  | 'user';

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================
// DASHBOARD & ANALYTICS
// ============================================

export interface KpiDashboard {
  summary: KpiSummary;
  categories: CategoryPerformance[];
  trends: KpiTrend[];
  alerts: KpiAlert[];
  actionPlans: ActionPlanSummary[];
}

export interface KpiSummary {
  totalTargets: number;
  achievedTargets: number;
  overallAchievement: number;
  onTrackTargets: number;
  delayedTargets: number;
  criticalIssues: number;
}

export interface CategoryPerformance {
  category: KPICategory;
  targetCount: number;
  achievementRate: number;
  trend: TrendDirection;
  status: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
}

export interface KpiTrend {
  period: string;
  actual: number;
  target: number;
  achievement: number;
}

export interface KpiAlert {
  id: number;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  category: string;
  department: string;
  createdAt: string;
}

export interface ActionPlanSummary {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}

// ============================================
// FILTERS & SEARCH
// ============================================

export interface KpiFilters {
  departments?: string[];
  categories?: number[];
  fiscalYear?: number;
  months?: number[];
  status?: ApprovalStatus[];
  priority?: PriorityLevel[];
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface KpiSortOption {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================
// EXPORT & REPORTING
// ============================================

export interface KpiExportRequest {
  format: 'excel' | 'pdf' | 'csv';
  filters: KpiFilters;
  includeCharts: boolean;
  includeDetails: boolean;
  template?: string;
}

export interface KpiReport {
  id: string;
  title: string;
  description?: string;
  type: ReportType;
  filters: KpiFilters;
  generatedAt: string;
  generatedBy: number;
  fileUrl: string;
  fileSize: number;
  downloadCount: number;
}

export type ReportType = 
  | 'monthly_performance'
  | 'quarterly_review'
  | 'annual_summary'
  | 'department_scorecard'
  | 'category_analysis'
  | 'custom';
