import { useMemo } from 'react';
import {
  Shield,
  Award,
  Truck,
  FileCheck,
  Users,
  Star,
  Leaf,
  DollarSign,
  Settings,
} from 'lucide-react';

export function useKPIData(categories: any[], subcategories: any[], measurements: any[]) {
  // Calculate statistics from database only - no fallback to mock data
  const totalCategories = useMemo(
    () => categories.length,
    [categories.length]
  );

  const totalSubcategories = useMemo(
    () => subcategories.length,
    [subcategories.length]
  );

  const totalMeasurements = useMemo(
    () => measurements.length,
    [measurements.length]
  );

  // Get category data from database only
  const getCategoryData = (categoryKey: string) => {
    // Try database first
    if (categories.length > 0) {
      const category = categories.find((c) => c.key === categoryKey);
      if (category) {
        const categorySubcategories = subcategories.filter((sc) => sc.category_id === category.id);
        const categoryMeasurements = measurements.filter((m) => m.category_id === category.id);

        return {
          id: category.id,
          key: category.key,
          name: category.name,
          subcategories: categorySubcategories.map((sc) => ({
            id: sc.id,
            name: sc.name,
            measurements: categoryMeasurements.filter((m) => m.sub_category_id === sc.id),
          })),
        };
      }
    }

    return null;
  };

  // Get category stats
  const getCategoryStats = (categoryKey: string) => {
    const categoryData = getCategoryData(categoryKey);
    if (!categoryData) return { subcategories: 0, measurements: 0 };

    const subcategories = categoryData.subcategories.length;
    const measurements = categoryData.subcategories.reduce(
      (sum: number, sub: any) => sum + (sub.measurements?.length || 0),
      0
    );

    return { subcategories, measurements };
  };

  // Get icon for category
  const getCategoryIcon = (categoryKey: string) => {
    const iconMap: Record<string, any> = {
      safety: Shield,
      quality: Award,
      delivery: Truck,
      compliance: FileCheck,
      hr: Users,
      attractive: Star,
      environment: Leaf,
      cost: DollarSign,
    };
    return iconMap[categoryKey] || Settings;
  };

  // Get color for category
  const getCategoryColor = (categoryKey: string) => {
    const colorMap: Record<string, string> = {
      safety: '#DC2626',
      quality: '#16A34A',
      delivery: '#2563EB',
      compliance: '#9333EA',
      hr: '#EA580C',
      attractive: '#DB2777',
      environment: '#0D9488',
      cost: '#4F46E5',
    };
    return colorMap[categoryKey] || '#6B7280';
  };

  return {
    totalCategories,
    totalSubcategories,
    totalMeasurements,
    getCategoryData,
    getCategoryStats,
    getCategoryIcon,
    getCategoryColor,
  };
}
