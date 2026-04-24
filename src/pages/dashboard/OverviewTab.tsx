import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, PieChart, Table as TableIcon } from 'lucide-react';
import { OverviewSummaryCard } from './cards/OverviewSummaryCard';
import { CategoryCards } from './cards/CategoryCards';
import { QuickStatsCards } from './cards/QuickStatsCards';
import { OverviewCharts } from './charts/OverviewCharts';
import { CategorySummaryTable } from './tables/CategorySummaryTable';
import { KPI_CATEGORIES } from './constants';

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
      {/* Tab Navigation */}
      <Tabs defaultValue="cards" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 h-10 w-fit">
          <TabsTrigger
            value="cards"
            className="data-[state=active]:bg-white h-8 px-4 text-sm flex items-center gap-2">
            <Target className="w-4 h-4" />
            Cards
          </TabsTrigger>
          <TabsTrigger
            value="charts"
            className="data-[state=active]:bg-white h-8 px-4 text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger
            value="table"
            className="data-[state=active]:bg-white h-8 px-4 text-sm flex items-center gap-2">
            <TableIcon className="w-4 h-4" />
            Table
          </TabsTrigger>
        </TabsList>

        {/* Cards Tab */}
        <TabsContent value="cards" className="space-y-6">
          <OverviewSummaryCard overallStats={overallStats} />
          <CategoryCards
            calculateCategoryStats={calculateCategoryStats}
            selectedCategory={selectedCategory}
          />
          <QuickStatsCards
            calculateCategoryStats={calculateCategoryStats}
            selectedCategory={selectedCategory}
          />
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          <OverviewCharts
            calculateCategoryStats={calculateCategoryStats}
            selectedCategory={selectedCategory}
          />
        </TabsContent>

        {/* Table Tab */}
        <TabsContent value="table" className="space-y-6">
          <CategorySummaryTable
            calculateCategoryStats={calculateCategoryStats}
            selectedCategory={selectedCategory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
