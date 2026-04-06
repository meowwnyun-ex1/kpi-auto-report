// KPI Auto Report Types

export type KPICategory = 
  | 'safety'
  | 'quality'
  | 'delivery'
  | 'compliance'
  | 'hr'
  | 'attractive'
  | 'environment'
  | 'cost';

export type KPIMetricType = 
  | 'count'      // จำนวน (เช่น จำนวนอุบัติเหตุ)
  | 'percentage' // เปอร์เซ็นต์ (เช่น % การส่งมอบตรงเวลา)
  | 'ratio'      // อัตราส่วน (เช่น อัตราการเกิดอุบัติเหตุต่อชั่วโมง)
  | 'amount'     // จำนวนเงิน (เช่น ต้นทุน)
  | 'score';     // คะแนน (เช่น คะแนนความพึงพอใจ)

export type KPITrend = 'up' | 'down' | 'stable';

export type KPICalculationMethod = 
  | 'sum'        // รวม
  | 'average'    // เฉลี่ย
  | 'max'        // สูงสุด
  | 'min'        // ต่ำสุด
  | 'count';     // นับจำนวน

// Department structure
export interface Department {
  id: number;
  name: string;
  code: string;
  category: KPICategory;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// KPI Metric definition
export interface KPIMetric {
  id: number;
  category: KPICategory;
  name: string;
  code: string;
  description?: string;
  unit: string;
  metric_type: KPIMetricType;
  target_value: number;
  warning_threshold?: number;
  critical_threshold?: number;
  calculation_method: KPICalculationMethod;
  is_active: boolean;
  department_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

// KPI Data Entry
export interface KPIDataEntry {
  id: number;
  metric_id: number;
  department_id?: number;
  value: number;
  target_value: number;
  achievement_percentage?: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  period_date: Date;  // วันที่ของช่วงเวลา
  entry_date: Date;   // วันที่กรอกข้อมูล
  entered_by: number; // user_id
  notes?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// KPI Summary for Dashboard
export interface KPISummary {
  category: KPICategory;
  metric_name: string;
  current_value: number;
  target_value: number;
  achievement_percentage: number;
  trend: KPITrend;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  last_updated: Date;
  department_name?: string;
}

// KPI Chart Data
export interface KPIChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

// KPI Dashboard Stats
export interface KPIDashboardStats {
  category: KPICategory;
  total_metrics: number;
  achieved_metrics: number;
  warning_metrics: number;
  critical_metrics: number;
  overall_achievement: number;
  trend: KPITrend;
  last_period_comparison: number; // % เปลี่ยนแปลงจากช่วงก่อน
}

// KPI Report
export interface KPIReport {
  id: number;
  category: KPICategory;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  period_start: Date;
  period_end: Date;
  generated_at: Date;
  generated_by: number;
  summaries: KPISummary[];
  dashboard_stats: KPIDashboardStats;
  charts: {
    trend: KPIChartData;
    breakdown: KPIChartData;
    comparison: KPIChartData;
  };
  insights?: string[];
  recommendations?: string[];
}

// KPI Category Config
export interface KPICategoryConfig {
  key: KPICategory;
  name: string;
  name_th: string;
  icon: string;
  color: string;
  description: string;
  departments: string[];
}

// KPI Category Configurations
export const KPI_CATEGORY_CONFIGS: KPICategoryConfig[] = [
  {
    key: 'safety',
    name: 'Safety',
    name_th: 'ความปลอดภัย',
    icon: 'Shield',
    color: '#EF4444',
    description: 'Safety performance metrics including accidents, incidents, and safety training',
    departments: ['Production', 'Maintenance', 'Quality', 'Logistics', 'Administration']
  },
  {
    key: 'quality',
    name: 'Quality',
    name_th: 'คุณภาพ',
    icon: 'Award',
    color: '#3B82F6',
    description: 'Quality metrics including defect rates, customer complaints, and quality certifications',
    departments: ['Production', 'Quality Assurance', 'Engineering', 'Process Improvement']
  },
  {
    key: 'delivery',
    name: 'Delivery',
    name_th: 'การส่งมอบ',
    icon: 'Truck',
    color: '#10B981',
    description: 'Delivery performance including on-time delivery, lead time, and logistics efficiency',
    departments: ['Production', 'Logistics', 'Planning', 'Shipping']
  },
  {
    key: 'compliance',
    name: 'Compliance',
    name_th: 'การปฏิบัติตาม',
    icon: 'FileCheck',
    color: '#8B5CF6',
    description: 'Compliance metrics including regulatory compliance, audit findings, and policy adherence',
    departments: ['Quality', 'Safety', 'Environment', 'HR', 'Administration']
  },
  {
    key: 'hr',
    name: 'HR',
    name_th: 'ทรัพยากรบุคคล',
    icon: 'Users',
    color: '#F59E0B',
    description: 'Human resources metrics including attendance, turnover, training, and employee satisfaction',
    departments: ['HR', 'Training', 'Administration', 'All Departments']
  },
  {
    key: 'attractive',
    name: 'Attractive',
    name_th: 'ความน่าสนใจ',
    icon: 'Star',
    color: '#EC4899',
    description: 'Attractiveness metrics including employee engagement, innovation, and workplace environment',
    departments: ['HR', 'Administration', 'Engineering', 'Production']
  },
  {
    key: 'environment',
    name: 'Environment',
    name_th: 'สิ่งแวดล้อม',
    icon: 'Leaf',
    color: '#22C55E',
    description: 'Environmental metrics including waste reduction, energy consumption, and environmental compliance',
    departments: ['Environment', 'Production', 'Maintenance', 'Administration']
  },
  {
    key: 'cost',
    name: 'Cost',
    name_th: 'ต้นทุน',
    icon: 'DollarSign',
    color: '#6366F1',
    description: 'Cost metrics including production costs, operational expenses, and cost reduction initiatives',
    departments: ['Finance', 'Production', 'Procurement', 'Administration']
  }
];

// Helper functions
export function getCategoryConfig(category: KPICategory): KPICategoryConfig {
  return KPI_CATEGORY_CONFIGS.find(c => c.key === category) || KPI_CATEGORY_CONFIGS[0];
}

export function getStatusColor(status: 'excellent' | 'good' | 'warning' | 'critical'): string {
  const colors = {
    excellent: '#10B981', // green
    good: '#3B82F6',      // blue
    warning: '#F59E0B',   // yellow
    critical: '#EF4444'   // red
  };
  return colors[status];
}

export function calculateAchievement(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.round((current / target) * 100);
}

export function determineStatus(
  achievement: number,
  warningThreshold: number = 80,
  criticalThreshold: number = 60
): 'excellent' | 'good' | 'warning' | 'critical' {
  if (achievement >= 100) return 'excellent';
  if (achievement >= warningThreshold) return 'good';
  if (achievement >= criticalThreshold) return 'warning';
  return 'critical';
}
