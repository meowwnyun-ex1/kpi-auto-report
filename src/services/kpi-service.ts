import { ApiService } from './api-service';

// KPI API Response Types
export interface KPISummaryResponse {
  success: boolean;
  data: {
    total_items: number;
    total_sub_categories: number;
    total_entries: number;
    completed_entries?: number;
    total_departments?: number;
  };
}

export interface KPISubCategory {
  id: number;
  name_en: string;
  name_th: string | null;
  key: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface KPIMetric {
  id: number;
  no: string | null;
  measurement: string;
  unit: string | null;
  fy25_target: string | null;
  main: string | null;
  main_relate: string | null;
  description_of_target: string | null;
  sub_category_id: number;
  sub_category_name?: string;
  sub_category_key?: string;
  department_id?: number;
  department_name?: string;
  department_key?: string;
}

export interface KPIDataEntry {
  id: number;
  metric_id: number;
  month: string;
  year: number;
  target: string | null;
  result: string | null;
  accu_target: string | null;
  accu_result: string | null;
  forecast?: string | null;
  reason?: string | null;
  recover_activity?: string | null;
  forecast_result_total?: string | null;
  recovery_month?: string | null;
  remark?: string | null;
  no?: string | null;
  measurement?: string;
  unit?: string | null;
  fy25_target?: string | null;
  main?: string | null;
  main_relate?: string | null;
  description_of_target?: string | null;
  sub_category_name?: string;
  sub_category_key?: string;
  department_name?: string;
  department_key?: string;
}

export interface KPIDashboardResponse {
  success: boolean;
  data: {
    summary_by_sub_category?: Array<{
      sub_category_id: number;
      sub_category_name: string;
      sub_category_key: string;
      total_items: number;
      total_entries: number;
      completed_entries: number;
    }>;
    summary_by_department?: Array<{
      department_id: number;
      department_name: string;
      department_key: string;
      total_items: number;
      total_entries: number;
      completed_entries: number;
    }>;
    latest_month?: {
      month: string;
      year: number;
    } | null;
  };
}

export interface Department {
  id: number;
  name_en: string;
  name_th: string | null;
  key: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// KPI Service Factory - creates service for each category
export const createKPIService = (category: string) => {
  const basePath = `/${category}`;

  return {
    // Summary
    getSummary: (year?: number) =>
      ApiService.get<KPISummaryResponse>(`${basePath}/summary`, { year }),

    // Sub-categories
    getSubCategories: () =>
      ApiService.get<{ success: boolean; data: KPISubCategory[] }>(`${basePath}/sub-categories`),

    // Metrics
    getMetrics: (subCategory?: string) =>
      ApiService.get<{ success: boolean; data: KPIMetric[] }>(`${basePath}/metrics`, {
        sub_category: subCategory,
      }),

    // Data Entries
    getEntries: (params?: { year?: number; month?: string; sub_category?: string }) =>
      ApiService.get<{ success: boolean; data: KPIDataEntry[] }>(`${basePath}/entries`, params),

    // All Entries for a department (historical data)
    getAllEntries: (params?: { department_id?: string }) =>
      ApiService.get<{ success: boolean; data: KPIDataEntry[] }>(`${basePath}/entries/all`, params),

    // Trend
    getTrend: (metricId: number, year?: number) =>
      ApiService.get<{ success: boolean; data: KPIDataEntry[] }>(`${basePath}/trend/${metricId}`, {
        year,
      }),

    // By Month
    getByMonth: (month: string, year?: number) =>
      ApiService.get<{ success: boolean; data: KPIDataEntry[] }>(`${basePath}/by-month/${month}`, {
        year,
      }),

    // Years
    getYears: () => ApiService.get<{ success: boolean; data: number[] }>(`${basePath}/years`),

    // Update Entry
    updateEntry: (id: number, data: Partial<KPIDataEntry>) => {
      ApiService.clearCache(`${basePath}/entries`);
      return ApiService.put<{ success: boolean; message: string }>(`${basePath}/update`, {
        id,
        ...data,
      });
    },

    // Dashboard
    getDashboard: (year?: number) =>
      ApiService.get<KPIDashboardResponse>(`${basePath}/dashboard`, { year }),

    // Department-specific routes (for ByDept categories)
    dept: {
      getSummary: (year?: number) =>
        ApiService.get<KPISummaryResponse>(`${basePath}/dept/summary`, { year }),

      getDepartments: () =>
        ApiService.get<{ success: boolean; data: Department[] }>(`${basePath}/dept/departments`),

      getSubCategories: () =>
        ApiService.get<{ success: boolean; data: KPISubCategory[] }>(
          `${basePath}/dept/sub-categories`
        ),

      getMetrics: (params?: { sub_category?: string; department?: string }) =>
        ApiService.get<{ success: boolean; data: KPIMetric[] }>(`${basePath}/dept/metrics`, params),

      getEntries: (params?: {
        year?: number;
        month?: string;
        sub_category?: string;
        department?: string;
      }) =>
        ApiService.get<{ success: boolean; data: KPIDataEntry[] }>(
          `${basePath}/dept/entries`,
          params
        ),

      getByDepartment: (departmentKey: string, params?: { year?: number; month?: string }) =>
        ApiService.get<{ success: boolean; data: KPIDataEntry[] }>(
          `${basePath}/dept/by-department/${departmentKey}`,
          params
        ),

      getByMonth: (month: string, params?: { year?: number; department?: string }) =>
        ApiService.get<{ success: boolean; data: KPIDataEntry[] }>(
          `${basePath}/dept/by-month/${month}`,
          params
        ),

      getCompare: (params?: { year?: number; month?: string; sub_category?: string }) =>
        ApiService.get<{ success: boolean; data: any[] }>(`${basePath}/dept/compare`, params),

      getYears: () =>
        ApiService.get<{ success: boolean; data: number[] }>(`${basePath}/dept/years`),

      updateEntry: (id: number, result: string) => {
        ApiService.clearCache(`${basePath}/dept/entries`);
        return ApiService.put<{ success: boolean; message: string }>(`${basePath}/dept/update`, {
          id,
          result,
        });
      },

      getDashboard: (year?: number) =>
        ApiService.get<KPIDashboardResponse>(`${basePath}/dept/dashboard`, { year }),
    },
  };
};

// Pre-created services for each category
export const SafetyService = createKPIService('safety');
export const HRService = createKPIService('hr');
export const CostService = createKPIService('cost');
export const DeliveryService = createKPIService('delivery');
export const ComplianceService = createKPIService('compliance');
export const AttractiveService = createKPIService('attractive');
export const EnvironmentService = createKPIService('environment');
export const QualityService = createKPIService('quality');

// Generic KPI Service - get service by category
export const getKPIService = (category: string) => createKPIService(category);
