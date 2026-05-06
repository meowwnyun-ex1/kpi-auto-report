/**
 * KPI System Types
 * Type definitions for KPI data structures
 */

export interface KPICategory {
  id: number;
  name: string;
  description?: string;
  image_thumbnail?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  image_thumbnail?: string;
}

export interface YearlyTarget {
  id: number;
  category_id: number;
  department: string;
  fy: string;
  target_value: number;
  result_value?: number;
  achievement_percentage?: number;
  created_at?: string;
  updated_at?: string;
  category?: Category;
}

export interface MonthlyTarget {
  id: number;
  yearly_target_id: number;
  month: string;
  target_value: number;
  result_value?: number;
  achievement_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface YearlyTargetWithMonths extends YearlyTarget {
  monthly_targets: MonthlyTarget[];
}

export interface Stats {
  total_categories: number;
  total_targets: number;
  total_result: number;
  overall_achievement: number;
}

export interface ActionPlan {
  id: number;
  category_id: number;
  department: string;
  fy: string;
  month?: string;
  action_item: string;
  responsible_person: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  role?: string;
}
