import {
  Shield,
  Award,
  Truck,
  Scale,
  Heart,
  Users,
  Leaf,
  DollarSign,
} from 'lucide-react';

export const KPI_CATEGORIES = [
  { id: 'safety', name: 'Safety', icon: Shield, color: '#DC2626' },
  { id: 'quality', name: 'Quality', icon: Award, color: '#16A34A' },
  { id: 'delivery', name: 'Delivery', icon: Truck, color: '#2563EB' },
  { id: 'compliance', name: 'Compliance', icon: Scale, color: '#9333EA' },
  { id: 'hr', name: 'HR', icon: Users, color: '#EA580C' },
  { id: 'attractive', name: 'Attractive', icon: Heart, color: '#DB2777' },
  { id: 'environment', name: 'Environment', icon: Leaf, color: '#0D9488' },
  { id: 'cost', name: 'Cost', icon: DollarSign, color: '#4F46E5' },
];

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
];

export type SortField = 'department' | 'measurement' | 'target' | 'result' | 'rate' | 'status';
export type SortDirection = 'asc' | 'desc';
