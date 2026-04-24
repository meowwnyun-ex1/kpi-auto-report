import React from 'react';
import {
  Shield,
  Award,
  Truck,
  FileCheck,
  Users,
  Star,
  Leaf,
  DollarSign,
} from 'lucide-react';

export interface Category {
  id: number;
  name: string;
  key: string;
  color: string;
}

export interface Department {
  dept_id: string;
  name_en: string;
  company: string | null;
}

export interface ActionPlan {
  id?: number;
  category_id: number;
  key_action: string;
  action_plan: string;
  person_in_charge: string;
  start_month: number;
  end_month: number;
  status: string;
  progress: number;
  created_at?: string;
  updated_at?: string;
}

export const MONTHS = [
  { value: 1, label: 'Jan', labelTh: 'ม.ค.' },
  { value: 2, label: 'Feb', labelTh: 'ก.พ.' },
  { value: 3, label: 'Mar', labelTh: 'มี.ค.' },
  { value: 4, label: 'Apr', labelTh: 'เม.ย.' },
  { value: 5, label: 'May', labelTh: 'พ.ค.' },
  { value: 6, label: 'Jun', labelTh: 'มิ.ย.' },
  { value: 7, label: 'Jul', labelTh: 'ก.ค.' },
  { value: 8, label: 'Aug', labelTh: 'ส.ค.' },
  { value: 9, label: 'Sep', labelTh: 'ก.ย.' },
  { value: 10, label: 'Oct', labelTh: 'ต.ค.' },
  { value: 11, label: 'Nov', labelTh: 'พ.ย.' },
  { value: 12, label: 'Dec', labelTh: 'ธ.ค.' },
];

export const STATUS_OPTIONS = [
  { value: 'Planned', color: 'bg-gray-500' },
  { value: 'In Progress', color: 'bg-blue-500' },
  { value: 'Completed', color: 'bg-green-500' },
  { value: 'Delayed', color: 'bg-red-500' },
  { value: 'Cancelled', color: 'bg-gray-400' },
];

export const CATEGORY_CONFIG: Record<
  string,
  { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  safety: { color: '#DC2626', icon: Shield },
  quality: { color: '#16A34A', icon: Award },
  delivery: { color: '#2563EB', icon: Truck },
  compliance: { color: '#9333EA', icon: FileCheck },
  hr: { color: '#EA580C', icon: Users },
  attractive: { color: '#DB2777', icon: Star },
  environment: { color: '#0D9488', icon: Leaf },
  cost: { color: '#4F46E5', icon: DollarSign },
};
