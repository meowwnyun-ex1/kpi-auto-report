import { ApiService } from './api-service';

// ============================================
// TYPES
// ============================================

export interface YearlyTarget {
  id: number;
  department_id: string;
  category_id: number;
  metric_id: number | null;
  fiscal_year: number;
  company_policy: string | null;
  department_policy: string | null;
  key_actions: string | null;
  remaining_kadai: string | null;
  environment_changes: string | null;
  fy_target: number | null;
  fy_target_text: string | null;
  main_pic: string | null;
  main_support: string | null;
  support_sdm: string | null;
  support_skd: string | null;
  president_approved: boolean;
  vp_approved: boolean;
  dept_head_approved: boolean;
  category_name: string;
  category_key: string;
  color: string;
  measurement: string;
  unit: string;
  metric_no: string;
  department_name: string;
}

export interface MonthlyEntry {
  id: number;
  yearly_target_id: number | null;
  department_id: string;
  category_id: number;
  metric_id: number | null;
  fiscal_year: number;
  month: number;
  way_of_measurement: string | null;
  target: number | null;
  target_text: string | null;
  result: number | null;
  result_text: string | null;
  ev: string | null;
  accu_target: number | null;
  accu_result: number | null;
  forecast: number | null;
  reason: string | null;
  recover_activity: string | null;
  recovery_month: number | null;
  dept_head_approved: boolean;
  approved_at: string | null;
  revision_flag: boolean;
  revision_note: string | null;
  category_name: string;
  category_key: string;
  color: string;
  measurement: string;
  unit: string;
  metric_no: string;
  department_name: string;
}

export interface ActionPlan {
  id: number;
  department_id: string;
  yearly_target_id: number | null;
  fiscal_year: number;
  key_action: string;
  action_plan: string | null;
  action_detail: string | null;
  target_of_action: string | null;
  result_of_action: string | null;
  person_in_charge: string | null;
  start_month: number | null;
  end_month: number | null;
  lead_time_months: number | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  actual_kickoff: string | null;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed';
  progress_percent: number;
  pdca_stage: 'P' | 'D' | 'C' | 'A' | null;
  pdca_notes: string | null;
  jan_status: string | null;
  feb_status: string | null;
  mar_status: string | null;
  apr_status: string | null;
  may_status: string | null;
  jun_status: string | null;
  jul_status: string | null;
  aug_status: string | null;
  sep_status: string | null;
  oct_status: string | null;
  nov_status: string | null;
  dec_status: string | null;
  sort_order: number;
  department_name: string;
  company?: string;
}

export interface TimelineEntry {
  id: number;
  department_id: string;
  department_name: string;
  company: string;
  category_id: number;
  category_name: string;
  category_key: string;
  metric_id: number | null;
  metric_no: string;
  measurement: string;
  unit: string;
  fy_target: number | null;
  month: number;
  target: number | null;
  result: number | null;
  accu_target: number | null;
  accu_result: number | null;
  judge: string | null;
  status: 'achieved' | 'not_achieved' | 'pending';
}

// ============================================
// SERVICE
// ============================================

export const KpiFormsService = {
  // Yearly Targets
  getYearlyTargets: (departmentId: string, fiscalYear: number) =>
    ApiService.get<{ success: boolean; data: YearlyTarget[] }>(
      `/kpi-forms/yearly/${departmentId}/${fiscalYear}`
    ),

  saveYearlyTarget: (data: Partial<YearlyTarget>) =>
    ApiService.post<{ success: boolean; message: string; data: { id: number } }>(
      '/kpi-forms/yearly',
      data
    ),

  approveYearlyTarget: (id: number, approvalType: 'president' | 'vp' | 'dept_head') =>
    ApiService.post<{ success: boolean; message: string }>(`/kpi-forms/yearly/${id}/approve`, {
      approval_type: approvalType,
    }),

  // Monthly Entries
  getMonthlyEntries: (departmentId: string, fiscalYear: number) =>
    ApiService.get<{ success: boolean; data: MonthlyEntry[] }>(
      `/kpi-forms/monthly/${departmentId}/${fiscalYear}`
    ),

  saveMonthlyEntry: (data: Partial<MonthlyEntry>) =>
    ApiService.post<{ success: boolean; message: string; data: { id: number } }>(
      '/kpi-forms/monthly',
      data
    ),

  approveMonthlyEntry: (id: number) =>
    ApiService.post<{ success: boolean; message: string }>(`/kpi-forms/monthly/${id}/approve`),

  // Action Plans
  getActionPlans: (departmentId: string, fiscalYear: number) =>
    ApiService.get<{ success: boolean; data: ActionPlan[] }>(
      `/kpi-forms/action-plans/${departmentId}/${fiscalYear}`
    ),

  saveActionPlan: (data: Partial<ActionPlan>) =>
    ApiService.post<{ success: boolean; message: string; data: { id: number } }>(
      '/kpi-forms/action-plans',
      data
    ),

  deleteActionPlan: (id: number) =>
    ApiService.delete<{ success: boolean; message: string }>(`/kpi-forms/action-plans/${id}`),

  // Timeline
  getTimeline: (fiscalYear: number, month: number, company?: string) => {
    const params = new URLSearchParams();
    if (company && company !== 'all') {
      params.append('company', company);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return ApiService.get<{ success: boolean; data: TimelineEntry[] }>(
      `/kpi-forms/timeline/${fiscalYear}/${month}${query}`
    );
  },

  // All yearly targets for overview
  getAllYearlyTargets: (fiscalYear: number) =>
    ApiService.get<{ success: boolean; data: YearlyTarget[] }>(
      `/kpi-forms/yearly/all/${fiscalYear}`
    ),

  // All monthly entries for overview
  getAllMonthlyEntries: (fiscalYear: number, company?: string, month?: number) => {
    const params = new URLSearchParams();
    if (company && company !== 'all') {
      params.append('company', company);
    }
    if (month) {
      params.append('month', month.toString());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return ApiService.get<{ success: boolean; data: MonthlyEntry[] }>(
      `/kpi-forms/monthly/all/${fiscalYear}${query}`
    );
  },

  // All action plans for overview
  getAllActionPlans: (fiscalYear: number, company?: string) => {
    const params = new URLSearchParams();
    if (company && company !== 'all') {
      params.append('company', company);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return ApiService.get<{ success: boolean; data: ActionPlan[] }>(
      `/kpi-forms/action-plans/all/${fiscalYear}${query}`
    );
  },
};

export default KpiFormsService;
