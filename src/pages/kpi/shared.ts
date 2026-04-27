export interface Category {
  id: number;
  name: string;
  key: string;
  description?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const MONTHS = [
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
] as const;

export const MONTH_LABELS: Record<number, string> = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Aug',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec',
};

// Re-export CatCard component and CAT category config
export { CatCard } from '@/shared/components/CatCard';
export { CAT } from '@/shared/components/CatCard';

// Stats per category — matches /api/kpi-forms/stats/:dept/:year response
export interface Stats {
  yearly: number;
  total_targets: number;
  total_results: number;
  months: Record<
    number,
    {
      targets: { total: number; set: number };
      results: { entered: number; achieved: number };
    }
  >;
}

// Yearly target — matches /api/kpi-forms/yearly/:dept/:year response
export interface YearlyTarget {
  id: number;
  department_id: string;
  category_id: number | null;
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
  total_target: number;
  used_quota: number;
  remaining_quota: number;
  dept_target: number | null;
  target_type: string | null;
  main_relate: string | null;
  metric_no: string | null;
  measurement: string | null;
  unit: string | null;
  main: string | null;
  description_of_target: string | null;
  category_name: string | null;
  category_key: string | null;
  sub_category_id: number | null;
  sub_category_name: string | null;
  department_name?: string;
  main_relate_display?: string;
  sort_order?: number;
  saving?: boolean;
  dirty?: boolean;
}

// Monthly target — matches /api/kpi-forms/monthly/:dept/:year response
export interface MonthlyTarget {
  id: number;
  yearly_target_id: number | null;
  department_id: string;
  category_id: number | null;
  fiscal_year: number;
  month: number;
  metric_no?: string | null;
  measurement?: string | null;
  unit?: string | null;
  main?: string | null;
  main_relate?: string | null;
  target: number | null;
  result: number | null;
  ev: string | null;
  accu_target: number | null;
  accu_result: number | null;
  forecast: number | null;
  reason: string | null;
  recover_activity: string | null;
  recovery_month: number | null;
  comment: string | null;
  image_url: string | null;
  image_caption: string | null;
  dept_head_approved: boolean;
  approved_at: string | null;
  category_name?: string | null;
  category_key?: string | null;
  sub_category_id?: number | null;
  sub_category_name?: string | null;
  total_target?: number | null;
  dept_target?: number | null;
  fy_target?: number | null;
  department_name?: string;
}

// YearlyTarget with monthly data — used by MonthlyResultPage
export interface YearlyTargetWithMonths {
  yearly_target_id: number;
  category_id?: number | null;
  sub_category_id?: number | null;
  sub_category_name?: string | null;
  measurement: string | null;
  unit: string | null;
  main: string | null;
  main_relate_display: string | null;
  fy_target: number | null;
  total_target: number;
  used_quota: number;
  remaining_quota: number;
  months: Record<number, any>;
}

// Derive category target values/counts from stats data (already fetched from /api/kpi-forms/stats)
export function deriveCategoryValuesFromStats(stats: Record<string, any>): {
  values: Record<string, number>;
  counts: Record<string, number>;
} {
  const values: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const [key, catStats] of Object.entries(stats)) {
    values[key] = catStats?.yearly ?? 0;
    counts[key] = catStats?.total_targets ?? 0;
  }
  return { values, counts };
}
