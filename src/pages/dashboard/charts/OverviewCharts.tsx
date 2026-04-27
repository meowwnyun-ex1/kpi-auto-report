import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { KPI_CATEGORIES } from '../constants';
import { BarChart3, PieChart, LineChart } from 'lucide-react';

interface OverviewChartsProps {
  calculateCategoryStats: (categoryId: number) => { target: number; result: number; count: number };
  selectedCategory?: string;
  categories?: { id: number; key: string; name: string }[];
}

export function OverviewCharts({
  calculateCategoryStats,
  selectedCategory = 'all',
  categories = [],
}: OverviewChartsProps) {
  // Build category lookup from API data instead of hardcoded map
  const categoryLookup = React.useMemo(() => {
    const map: Record<string, number> = {};
    categories.forEach((c) => {
      map[c.key] = c.id;
    });
    return map;
  }, [categories]);

  // Filter categories based on selection
  const categoriesToShow =
    selectedCategory === 'all'
      ? KPI_CATEGORIES
      : KPI_CATEGORIES.filter((cat) => cat.id === selectedCategory);

  const getPerformanceColor = (achievement: number) => {
    if (achievement >= 95) return 'bg-slate-600';
    if (achievement >= 80) return 'bg-slate-500';
    if (achievement >= 60) return 'bg-slate-400';
    return 'bg-slate-300';
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overall Performance Chart */}
        <Card className="border border-gray-200/60 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Overall Performance</h3>
                <p className="text-sm text-gray-600">Achievement by category</p>
              </div>
            </div>
            <div className="h-80 flex items-center justify-center bg-white rounded-lg border border-gray-100/60">
              <div className="text-center w-full">
                <div className="flex items-end justify-center gap-4 h-48">
                  {categoriesToShow.map((cat, idx) => {
                    const stats = calculateCategoryStats(categoryLookup[cat.id]);
                    const achievement = stats.target > 0 ? (stats.result / stats.target) * 100 : 0;

                    return (
                      <div key={cat.id} className="flex flex-col items-center gap-2">
                        <div className="relative w-12">
                          <div
                            className="w-12 bg-gradient-to-t rounded-t-lg transition-all duration-500"
                            style={{
                              height: `${Math.min(100, achievement)}%`,
                              background: `linear-gradient(to top, ${cat.color}, ${cat.color}60)`,
                            }}></div>
                          <div
                            className={`absolute -top-2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${getPerformanceColor(achievement)}`}>
                            <span className="text-white font-bold text-xs">
                              {achievement.toFixed(0)}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 font-medium max-w-[80px] truncate">
                          {cat.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                    <span className="text-sm font-medium text-gray-600">95%+</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    <span className="text-sm font-medium text-gray-600">80-94%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    <span className="text-sm font-medium text-gray-600">60-79%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    <span className="text-sm font-medium text-gray-600">&lt;60%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card className="border border-gray-200/60 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Category Distribution</h3>
                <p className="text-sm text-gray-600">Target allocation overview</p>
              </div>
            </div>
            <div className="h-80 flex items-center justify-center bg-white rounded-lg border border-gray-100/60">
              <div className="grid grid-cols-3 gap-6">
                {categoriesToShow.slice(0, 9).map((cat, idx) => {
                  const stats = calculateCategoryStats(categoryLookup[cat.id]);
                  const totalTarget = categoriesToShow.reduce(
                    (total, c) => total + calculateCategoryStats(categoryLookup[c.id]).target,
                    0
                  );
                  const percentage = totalTarget > 0 ? (stats.target / totalTarget) * 100 : 0;

                  return (
                    <div key={cat.id} className="text-center">
                      <div className="relative mb-3">
                        <div
                          className="w-20 h-20 rounded-full mx-auto border-4 shadow-lg"
                          style={{
                            borderColor: cat.color,
                            backgroundColor: `${cat.color}20`,
                          }}></div>
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-2 py-1 shadow-lg">
                          <span className="text-xs font-bold" style={{ color: cat.color }}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate block">
                        {cat.name}
                      </span>
                      <div className="text-xs text-gray-500">
                        Target: {stats.target.toLocaleString()}
                      </div>
                      <div className="text-xs font-medium" style={{ color: cat.color }}>
                        Result: {stats.result.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card className="border border-gray-200/60 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
              <LineChart className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Monthly Performance Trends</h3>
              <p className="text-sm text-gray-600">6-month performance overview</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-white rounded-lg border border-gray-100/60">
            <div className="text-center w-full">
              <div className="flex items-center justify-center gap-3 h-40">
                {KPI_CATEGORIES.map((cat) => {
                  const catId = categoryLookup[cat.id] || 0;
                  const stats = catId ? calculateCategoryStats(catId) : { target: 0, result: 0 };
                  const rate = stats.target > 0 ? (stats.result / stats.target) * 100 : 0;
                  return (
                    <div key={cat.id} className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <div
                          className="w-10 bg-gradient-to-t rounded-lg transition-all duration-500"
                          style={{
                            height: `${Math.max(8, Math.min(80, rate * 0.8))}px`,
                            background: `linear-gradient(to top, ${cat.color}, ${cat.color}40)`,
                          }}></div>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        {cat.name.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <span className="text-sm font-medium text-gray-600">
                    Per category achievement
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
