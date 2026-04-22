/**
 * Shared Type Definitions - KPI Management Tool
 */

// ============ ENTITIES ============

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  department_id?: string;
  department_name?: string;
  created_at: string;
  updated_at: string;
}

export interface KPICategory {
  id: number;
  name: string;
  key: string;
  icon?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface YearlyTarget {
  id?: number;
  category_id: number;
  metric_id?: number;
  metric_no: string;
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

export interface MonthlyEntry {
  id?: number;
  yearly_target_id?: number;
  category_id: number;
  metric_id?: number;
  metric_no: string;
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

export interface ActionPlan {
  id?: number;
  department_id: string;
  category_id: number;
  metric_id?: number;
  metric_no: string;
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

export interface Department {
  dept_id: string;
  name_en: string;
  name_th?: string;
  kpi_code?: string;
  spo_dept_id?: string;
  company?: string;
  is_kpi_dept: boolean;
}

// ============ API RESPONSES ============

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface KPIStats {
  totalYearlyTargets: number;
  totalMonthlyEntries: number;
  totalActionPlans: number;
  totalUsers: number;
  totalCategories: number;
  totalDepartments: number;
}
