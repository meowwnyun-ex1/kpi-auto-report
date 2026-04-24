import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { KPI_CATEGORIES } from '../constants';
import { BarChart3, PieChart, LineChart } from 'lucide-react';

interface OverviewChartsProps {
  calculateCategoryStats: (categoryId: number) => { target: number; result: number; count: number };
  selectedCategory?: string;
}

export function OverviewCharts({ calculateCategoryStats, selectedCategory = 'all' }: OverviewChartsProps) {
  // Filter categories based on selection
  const categoriesToShow =
    selectedCategory === 'all'
      ? KPI_CATEGORIES
      : KPI_CATEGORIES.filter((cat) => cat.id === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Performance Chart */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Overall Performance</h3>
            </div>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
              <div className="text-center">
                <div className="flex items-end gap-2 h-32">
                  {categoriesToShow.map((cat, idx) => {
                    const stats = calculateCategoryStats(Number(cat.id));
                    const achievement = stats.target > 0 ? (stats.result / stats.target) * 100 : 0;
                    return (
                      <div key={cat.id} className="flex flex-col items-center gap-1">
                        <div
                          className="w-10 bg-gradient-to-t"
                          style={{
                            height: `${(achievement / 100) * 100}px`,
                            background: `linear-gradient(to top, ${cat.color}, ${cat.color}60)`,
                          }}
                        ></div>
                        <span className="text-xs text-gray-500 max-w-[60px] truncate">{cat.name}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm text-gray-500">Achievement by category</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Category Distribution</h3>
            </div>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-200">
              <div className="text-center">
                <div className="grid grid-cols-3 gap-4">
                  {categoriesToShow.slice(0, 9).map((cat, idx) => {
                    const stats = calculateCategoryStats(Number(cat.id));
                    return (
                      <div key={cat.id} className="text-center">
                        <div
                          className="w-12 h-12 rounded-full mx-auto mb-2 border-4"
                          style={{
                            borderColor: cat.color,
                            backgroundColor: `${cat.color}20`,
                          }}
                        ></div>
                        <span className="text-xs text-gray-500">{cat.name}</span>
                        <p className="text-xs font-medium">{stats.target}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Monthly Trends</h3>
          </div>
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200">
            <div className="text-center w-full">
              <div className="flex items-center justify-center gap-2 h-32">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, idx) => (
                  <div key={month} className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 bg-gradient-to-t"
                      style={{
                        height: `${Math.random() * 60 + 30}px`,
                        background: `linear-gradient(to top, #10B981, #10B98160)`,
                      }}
                    ></div>
                    <span className="text-xs text-gray-500">{month}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500">Monthly performance trends across all categories</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
