import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, PieChart, Table as TableIcon } from 'lucide-react';
import { OverviewSummaryCard } from '../cards/OverviewSummaryCard';
import { CatCard } from '@/shared/components/CatCard';
import { QuickStatsCards } from '../cards/QuickStatsCards';
import { OverviewCharts } from '../charts/OverviewCharts';
import { CategorySummaryTable } from '../tables/CategorySummaryTable';
import { KPI_CATEGORIES } from '../constants';

interface OverviewTabProps {
  kpiData: any[];
  calculateTotalTargets: () => number;
  calculateCategoryStats: (categoryId: number) => { target: number; result: number; count: number };
  selectedCategory?: string;
}

export function OverviewTab({
  calculateTotalTargets,
  calculateCategoryStats,
  selectedCategory = 'all',
}: OverviewTabProps) {
  const navigate = useNavigate();

  // Calculate overall stats
  const overallStats = React.useMemo(() => {
    const totalTargets = calculateTotalTargets();
    let totalResult = 0;

    const categoriesToShow =
      selectedCategory === 'all'
        ? KPI_CATEGORIES
        : KPI_CATEGORIES.filter((cat) => cat.id === selectedCategory);

    categoriesToShow.forEach((cat) => {
      const stats = calculateCategoryStats(Number(cat.id));
      totalResult += stats.result;
    });

    const overallRate = totalTargets > 0 ? (totalResult / totalTargets) * 100 : 0;

    return {
      totalTargets,
      totalResult,
      overallRate,
      categoryCount: categoriesToShow.length,
    };
  }, [selectedCategory, calculateTotalTargets, calculateCategoryStats]);

  return (
    <div className="space-y-6">
      <OverviewSummaryCard overallStats={overallStats} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {KPI_CATEGORIES.map((category) => (
          <CatCard
            key={category.id}
            c={category}
            calculateCategoryStats={calculateCategoryStats}
            selectedCategory={selectedCategory}
            navigateTo={(categoryId) => navigate(`/dashboard/${categoryId}`)}
          />
        ))}
      </div>
      <QuickStatsCards
        calculateCategoryStats={calculateCategoryStats}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}
