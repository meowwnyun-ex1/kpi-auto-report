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

export interface DepartmentMeasurement {
  id: number;
  measurement: string;
  unit: string | null;
  fy25_target: string | null;
  main: string | null;
  main_relate: string | null;
  description_of_target: string | null;
  sub_category_id: number | null;
  sub_category_name: string | null;
  sub_category_key: string | null;
  department_id: string | null;
  department_name: string | null;
}

export interface DepartmentWithMeasurements {
  dept_id: string;
  name_en: string;
  has_measurements: boolean;
  measurement_count: number;
  filled_count: number;
}

export const DepartmentService = {
  // Get all departments
  getDepartments: () =>
    ApiService.get<{ success: boolean; data: Department[]; source: string }>('/departments'),

  // Get departments with measurements for a specific category
  getDepartmentsWithMeasurements: (category: string) =>
    ApiService.get<{ success: boolean; data: DepartmentWithMeasurements[] }>(
      `/departments/with-measurements/${category}`
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

  // Get measurements for a department, category, and optionally sub-category
  getDepartmentMeasurements: (deptId: string, category: string, subCategory?: string) => {
    const path = subCategory
      ? `/departments/${deptId}/measurements/${category}/${subCategory}`
      : `/departments/${deptId}/measurements/${category}`;
    return ApiService.get<{ success: boolean; data: DepartmentMeasurement[] }>(path);
  },
};

export default DepartmentService;
