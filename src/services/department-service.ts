import { ApiService } from './api-service';

export interface Department {
  id: number;
  dept_code: string;
  dept_id: string;
  name_en: string;
  name_th: string | null;
  type: string | null;
  company: string | null;
  status: string;
  sort_order: number;
}

export interface DepartmentCategory {
  id: number;
  name_en: string;
  name_th: string | null;
  key: string;
  color: string;
  icon: string;
  sort_order: number;
}

export interface DepartmentSubCategory {
  id: number;
  name_en: string;
  name_th: string | null;
  key: string;
  sort_order: number;
}

export interface DepartmentMetric {
  id: number;
  no: string | null;
  measurement: string;
  unit: string | null;
  fy25_target: string | null;
  main: string | null;
  main_relate: string | null;
  description_of_target: string | null;
  sub_category_id: number;
  sub_category_name: string;
  sub_category_key: string;
  department_id: string | null;
  department_name: string | null;
}

export interface DepartmentWithMetrics {
  dept_id: string;
  name_en: string;
  has_metrics: boolean;
  metric_count: number;
  filled_count: number;
}

export const DepartmentService = {
  // Get all departments
  getDepartments: () =>
    ApiService.get<{ success: boolean; data: Department[]; source: string }>('/departments'),

  // Get departments with metrics for a specific category
  getDepartmentsWithMetrics: (category: string) =>
    ApiService.get<{ success: boolean; data: DepartmentWithMetrics[] }>(
      `/departments/with-metrics/${category}`
    ),

  // Get categories for a department
  getDepartmentCategories: (deptId: string) =>
    ApiService.get<{ success: boolean; data: DepartmentCategory[] }>(
      `/departments/${deptId}/categories`
    ),

  // Get sub-categories for a department and category
  getDepartmentSubCategories: (deptId: string, category: string) =>
    ApiService.get<{ success: boolean; data: DepartmentSubCategory[] }>(
      `/departments/${deptId}/sub-categories/${category}`
    ),

  // Get metrics for a department, category, and optionally sub-category
  getDepartmentMetrics: (deptId: string, category: string, subCategory?: string) => {
    const path = subCategory
      ? `/departments/${deptId}/metrics/${category}/${subCategory}`
      : `/departments/${deptId}/metrics/${category}`;
    return ApiService.get<{ success: boolean; data: DepartmentMetric[] }>(path);
  },
};

export default DepartmentService;
