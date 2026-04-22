// Types for Overview Page

export interface Category {
  id: number;
  name: string;
  key: string;
  color?: string;
}

export interface KPIStatus {
  department_id: string;
  department_name: string;
  category_id: number;
  category_name: string;
  category_key: string;
  total_metrics: number;
  filled_metrics: number;
  missing_metrics: number;
  achievement_rate: number;
  status: 'complete' | 'partial' | 'missing';
}

export interface KPIDetail {
  id: number;
  department_id: string;
  department_name: string;
  category_id: number;
  category_name: string;
  category_key: string;
  metric_no: string;
  measurement: string;
  unit?: string;
  main?: string;
  target?: number | null;
  result?: number | null;
  ev?: string | null;
  accu_target?: number;
  accu_result?: number;
  comment?: string;
  image_url?: string;
  month?: number;
  fy_target?: number | null;
  total_quota?: number | null; // Backend uses total_quota
  dept_quota?: number | null; // Backend uses dept_quota
}

export interface Summary {
  targetCount: number;
  resultCount: number;
  passedItems: number;
  overallRate: number;
  passRate: number;
  completeDepartments: number;
  partialDepartments: number;
  missingDepartments: number;
}

export interface DepartmentData {
  name: string;
  target: number;
  result: number;
  rate: number;
}

export interface ColumnFilters {
  department: string;
  measurement: string;
  unit: string;
  judge: string;
  accu_judge: string;
}
