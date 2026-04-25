export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: number;
  order_index?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface KPITarget {
  id: number;
  category_id: number;
  target_value: number;
  actual_value?: number;
  achievement_rate?: number;
  fiscal_year: number;
  month?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface KPIData {
  categories: Category[];
  targets: KPITarget[];
  stats?: {
    totalCategories: number;
    totalTargets: number;
    achievementRate: number;
  };
}

export interface KPIFilters {
  department?: string;
  fiscalYear?: number;
  month?: number;
  category?: number;
  status?: 'active' | 'inactive';
}

export const MONTHS = [
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
] as const;

// Re-export CatCard as CAT for backward compatibility
export { CatCard } from '@/shared/components/CatCard';
export const CAT = CatCard;

// Add Stats interface
export interface Stats {
  totalCategories: number;
  totalTargets: number;
  achievementRate: number;
}

// Add YearlyTarget interface (alias for KPITarget)
export interface YearlyTarget extends KPITarget {}

// Placeholder for useCalculateTotalTargetValues hook
export const useCalculateTotalTargetValues = () => {
  return {
    calculateTotal: (targets: KPITarget[]) =>
      targets.reduce((sum, target) => sum + target.target_value, 0),
    calculateAverage: (targets: KPITarget[]) =>
      targets.length > 0
        ? targets.reduce((sum, target) => sum + target.target_value, 0) / targets.length
        : 0,
  };
};
