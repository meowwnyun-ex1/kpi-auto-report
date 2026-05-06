import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPI_CATEGORIES } from '../constants';
import { Table as TableIcon } from 'lucide-react';

interface CategorySummaryTableProps {
  calculateCategoryStats: (categoryId: number) => { target: number; result: number; count: number };
  selectedCategory?: string;
}

export function CategorySummaryTable({
  calculateCategoryStats,
  selectedCategory = 'all',
}: CategorySummaryTableProps) {
  // Filter categories based on selection
  const categoriesToShow =
    selectedCategory === 'all'
      ? KPI_CATEGORIES
      : KPI_CATEGORIES.filter((cat) => cat.id === selectedCategory);

  const getPerformanceBadge = (achievement: number) => {
    if (achievement >= 95)
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Excellent</Badge>
      );
    if (achievement >= 80)
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Good</Badge>;
    if (achievement >= 60)
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200">Needs Work</Badge>;
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TableIcon className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Category Summary Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4 font-medium text-gray-700">Category</th>
                <th className="text-center py-2 px-4 font-medium text-gray-700">Measurements</th>
                <th className="text-right py-2 px-4 font-medium text-gray-700">Target</th>
                <th className="text-right py-2 px-4 font-medium text-gray-700">Result</th>
                <th className="text-right py-2 px-4 font-medium text-gray-700">Achievement</th>
                <th className="text-center py-2 px-4 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {categoriesToShow.map((cat) => {
                const stats = calculateCategoryStats(Number(cat.id));
                const achievement = stats.target > 0 ? (stats.result / stats.target) * 100 : 0;
                return (
                  <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: cat.color }}></div>
                        <span className="font-medium">{cat.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">{stats.count}</td>
                    <td className="text-right py-3 px-4 font-mono">
                      {stats.target.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 font-mono" style={{ color: cat.color }}>
                      {stats.result.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span
                        className={`font-mono font-medium ${achievement >= 95 ? 'text-green-600' : achievement >= 75 ? 'text-blue-600' : achievement >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {achievement.toFixed(2)}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">{getPerformanceBadge(achievement)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
