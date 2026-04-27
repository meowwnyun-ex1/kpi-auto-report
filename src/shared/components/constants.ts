import { Shield, Award, Truck, FileCheck, Users, Star, Leaf, DollarSign } from 'lucide-react';
import { CATEGORY_COLORS } from '@/shared/constants/colors';

export const CAT: Record<
  string,
  { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  safety: { color: CATEGORY_COLORS.safety, icon: Shield },
  quality: { color: CATEGORY_COLORS.quality, icon: Award },
  delivery: { color: CATEGORY_COLORS.delivery, icon: Truck },
  compliance: { color: CATEGORY_COLORS.compliance, icon: FileCheck },
  hr: { color: CATEGORY_COLORS.hr, icon: Users },
  attractive: { color: CATEGORY_COLORS.attractive, icon: Star },
  environment: { color: CATEGORY_COLORS.environment, icon: Leaf },
  cost: { color: CATEGORY_COLORS.cost, icon: DollarSign },
};

export const MONTHS = [
  { value: 'all', label: 'All Months' },
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
