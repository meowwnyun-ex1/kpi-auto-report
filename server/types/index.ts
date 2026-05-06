// ============================================
// KPI Management Tool - Type Definitions
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  full_name?: string;
  role: 'admin' | 'user' | 'manager' | 'superadmin';
  is_active: boolean;
  department_id?: string;
  department_name?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// KPI Category
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

// KPI Yearly Target
export interface YearlyTarget {
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

// KPI Monthly Entry
export interface MonthlyEntry {
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

// KPI Action Plan
export interface ActionPlan {
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

// Department Mapping
export interface DepartmentMapping {
  kpi_code: string;
  spo_dept_id: string;
  description?: string;
}

// KPI Stats
export interface KPIStats {
  totalYearlyTargets: number;
  totalMonthlyEntries: number;
  totalActionPlans: number;
  totalUsers: number;
  totalCategories: number;
  totalDepartments: number;
}

// Generic API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Database Config
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

// Server Config
export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  upload: {
    maxSize: number;
    allowedTypes: string[];
    destination: string;
  };
  database: DatabaseConfig;
  kpiDatabase: DatabaseConfig;
}
