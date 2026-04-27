import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface CategoryChartData {
  name: string;
  target: number;
  result: number;
  passed: number;
  completionRate: number;
}

interface CategoriesTabProps {
  categoryChartData: CategoryChartData[];
}

export function CategoriesTab({ categoryChartData }: CategoriesTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Category Performance
          </div>
          <div className="text-sm text-gray-500 font-normal">{categoryChartData.length} rows</div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryChartData.map((category, idx) => (
            <Card key={category.name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <span className="font-medium text-sm">{category.name}</span>
                  </div>
                  <div className="text-xs text-gray-500">{category.completionRate.toFixed(1)}%</div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Target:</span>
                    <span className="font-medium text-sm">{category.target}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Result:</span>
                    <span className="font-medium text-green-600 text-sm">{category.result}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Passed:</span>
                    <span className="font-medium text-emerald-600 text-sm">{category.passed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${category.completionRate >= 100 ? 'bg-green-500' : category.completionRate >= 75 ? 'bg-blue-500' : category.completionRate >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(category.completionRate, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
