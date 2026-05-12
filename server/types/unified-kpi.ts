/**
 * Enterprise KPI System - Unified Backend Types
 * World-class standardized data structure for server-side consistency
 */

// ============================================
// BASE ENTITIES
// ============================================

export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AuditableEntity extends BaseEntity {
  created_by?: number;
  updated_by?: number;
  version: number;
}

// ============================================
// USER & AUTHENTICATION
// ============================================

export interface User extends BaseEntity {
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id?: string;
  department_name?: string;
  last_login_at?: string;
  profile_image_url?: string;
  password_hash?: string;
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
  name_th?: string;
  description?: string;
  parent_id?: string;
  level: number;
  sort_order: number;
  head_of_department?: string;
  contact_email?: string;
}

// ============================================
// KPI CATEGORY
// ============================================

export interface KPICategory extends BaseEntity {
  key: string;
  name: string;
  name_th?: string;
  description?: string;
  icon?: string;
  color?: string;
  priority: PriorityLevel;
  sort_order: number;
  parent_id?: number;
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
  category_id: number;
  name: string;
  name_th?: string;
  description?: string;
  unit: string;
  data_type: DataType;
  calculation_formula?: string;
  target_direction: TargetDirection;
  sort_order: number;
  main_department_id?: string;
  related_department_ids?: string;
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
  category_id: number;
  measurement_id: number;
  department_id: string;
  fiscal_year: number;
  target_value: number;
  target_text?: string;
  stretch_target?: number;
  minimum_target?: number;
  key_actions?: string;
  responsible_person?: string;
  approval_status: ApprovalStatus;
  hos_approved?: boolean;
  hod_approved?: boolean;
  hos_approved_by?: number;
  hod_approved_by?: number;
  hos_approved_at?: string;
  hod_approved_at?: string;
}

export interface KpiMonthlyTarget extends AuditableEntity {
  yearly_target_id: number;
  month: number;
  target_value: number;
  forecast_value?: number;
  approval_status: ApprovalStatus;
  hos_approved?: boolean;
  hod_approved?: boolean;
  hos_approved_by?: number;
  hod_approved_by?: number;
  hos_approved_at?: string;
  hod_approved_at?: string;
}

export interface KpiMonthlyResult extends AuditableEntity {
  monthly_target_id: number;
  result_value: number;
  achievement_percentage?: number;
  variance?: number;
  comments?: string;
  evidence_attachments?: string;
  declaration_text?: string;
  approval_status: ApprovalStatus;
  hos_approved?: boolean;
  hod_approved?: boolean;
  admin_approved?: boolean;
  hos_approved_by?: number;
  hod_approved_by?: number;
  admin_approved_by?: number;
  hos_approved_at?: string;
  hod_approved_at?: string;
  admin_approved_at?: string;
  is_incomplete?: boolean;
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
  category_id: number;
  measurement_id?: number;
  department_id: string;
  fiscal_year: number;
  month?: number;
  title: string;
  description?: string;
  action_items?: ActionItem[];
  responsible_person: string;
  target_date: string;
  status: ActionPlanStatus;
  progress_percentage: number;
  priority: PriorityLevel;
  budget_allocated?: number;
  budget_spent?: number;
  remarks?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  due_date?: string;
  status: ActionItemStatus;
  completed_at?: string;
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
  target_id: number;
  period: PerformancePeriod;
  actual_value: number;
  target_value: number;
  achievement_percentage: number;
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
  user_id: number;
  type: NotificationType;
  entity_type: NotificationEntityType;
  entity_id: number;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
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
// DATABASE MAPPINGS (SQL Server)
// ============================================

export interface DatabaseMapping {
  // Table names
  USERS: 'users';
  DEPARTMENTS: 'departments';
  KPI_CATEGORIES: 'kpi_categories';
  KPI_MEASUREMENTS: 'kpi_measurements';
  KPI_YEARLY_TARGETS: 'kpi_yearly_targets';
  KPI_MONTHLY_TARGETS: 'kpi_monthly_targets';
  KPI_MONTHLY_RESULTS: 'kpi_monthly_results';
  KPI_ACTION_PLANS: 'kpi_action_plans';
  KPI_NOTIFICATIONS: 'kpi_notifications';
  KPI_DEPARTMENT_APPROVERS: 'kpi_department_approvers';
  KPI_APPROVAL_LOGS: 'kpi_approval_logs';
  KPI_RESULT_DECLARATIONS: 'kpi_result_declarations';
}

export const DB_TABLES: DatabaseMapping = {
  USERS: 'users',
  DEPARTMENTS: 'departments',
  KPI_CATEGORIES: 'kpi_categories',
  KPI_MEASUREMENTS: 'kpi_measurements',
  KPI_YEARLY_TARGETS: 'kpi_yearly_targets',
  KPI_MONTHLY_TARGETS: 'kpi_monthly_targets',
  KPI_MONTHLY_RESULTS: 'kpi_monthly_results',
  KPI_ACTION_PLANS: 'kpi_action_plans',
  KPI_NOTIFICATIONS: 'kpi_notifications',
  KPI_DEPARTMENT_APPROVERS: 'kpi_department_approvers',
  KPI_APPROVAL_LOGS: 'kpi_approval_logs',
  KPI_RESULT_DECLARATIONS: 'kpi_result_declarations',
};

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  request_id?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
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
  action_plans: ActionPlanSummary[];
}

export interface KpiSummary {
  total_targets: number;
  achieved_targets: number;
  overall_achievement: number;
  on_track_targets: number;
  delayed_targets: number;
  critical_issues: number;
}

export interface CategoryPerformance {
  category: KPICategory;
  target_count: number;
  achievement_rate: number;
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
  created_at: string;
}

export interface ActionPlanSummary {
  total: number;
  completed: number;
  in_progress: number;
  overdue: number;
  completion_rate: number;
}

// ============================================
// FILTERS & SEARCH
// ============================================

export interface KpiFilters {
  departments?: string[];
  categories?: number[];
  fiscal_year?: number;
  months?: number[];
  status?: ApprovalStatus[];
  priority?: PriorityLevel[];
  search?: string;
  date_range?: {
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
  include_charts: boolean;
  include_details: boolean;
  template?: string;
}

export interface KpiReport {
  id: string;
  title: string;
  description?: string;
  type: ReportType;
  filters: KpiFilters;
  generated_at: string;
  generated_by: number;
  file_url: string;
  file_size: number;
  download_count: number;
}

export type ReportType = 
  | 'monthly_performance'
  | 'quarterly_review'
  | 'annual_summary'
  | 'department_scorecard'
  | 'category_analysis'
  | 'custom';

// ============================================
// LEGACY COMPATIBILITY MAPPINGS
// ============================================

export interface LegacyYearlyTarget {
  id?: number;
  category_id: number;
  measurement_id?: number;
  measurement: string;
  unit?: string;
  main?: string;
  main_relate?: string;
  description_of_target?: string;
  fy_target?: number;
  fy_target_text?: string;
  key_actions?: string;
  main_pic?: string;
  fiscal_year: number;
  is_custom?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LegacyMonthlyEntry {
  id?: number;
  yearly_target_id?: number;
  category_id: number;
  measurement_id?: number;
  measurement: string;
  unit?: string;
  main?: string;
  main_relate?: string;
  fy_target?: number;
  fy_target_text?: string;
  month: number;
  target?: number;
  result?: number;
  ev?: number;
  accu_target?: number;
  accu_result?: number;
  forecast?: number;
  remark?: string;
  is_custom?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LegacyActionPlan {
  id?: number;
  department_id: string;
  category_id: number;
  measurement_id?: number;
  measurement: string;
  fiscal_year: number;
  action_plan?: string;
  pic?: string;
  target_date?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress?: number;
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// MIGRATION HELPERS
// ============================================

export const mapLegacyToUnified = {
  yearlyTarget: (legacy: LegacyYearlyTarget): Partial<KpiYearlyTarget> => ({
    category_id: legacy.category_id,
    measurement_id: legacy.measurement_id,
    department_id: legacy.main || '',
    fiscal_year: legacy.fiscal_year,
    target_value: legacy.fy_target || 0,
    target_text: legacy.fy_target_text,
    key_actions: legacy.key_actions,
    responsible_person: legacy.main_pic,
  }),
  
  monthlyEntry: (legacy: LegacyMonthlyEntry): Partial<KpiMonthlyResult> => ({
    monthly_target_id: legacy.yearly_target_id,
    result_value: legacy.result || 0,
    comments: legacy.remark,
  }),
  
  actionPlan: (legacy: LegacyActionPlan): Partial<KpiActionPlan> => ({
    category_id: legacy.category_id,
    measurement_id: legacy.measurement_id,
    department_id: legacy.department_id,
    fiscal_year: legacy.fiscal_year,
    title: legacy.measurement,
    description: legacy.action_plan,
    responsible_person: legacy.pic,
    target_date: legacy.target_date,
    status: legacy.status as ActionPlanStatus,
    progress_percentage: legacy.progress || 0,
    remarks: legacy.remark,
  }),
};
