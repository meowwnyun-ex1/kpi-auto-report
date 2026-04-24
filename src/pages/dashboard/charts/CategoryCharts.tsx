import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MONTHS } from '../constants';
import { PieChart, LineChart, BarChart3 } from 'lucide-react';

interface CategoryChartsProps {
  catStats: {
    totalTargets: number;
    filledCount: number;
    passedCount: number;
    failedCount: number;
    pendingCount: number;
    achievementRate: number;
    passRate: number;
    totalTarget: number;
    totalResult: number;
    resultRate: number;
  };
  deptBreakdown: Array<{
    name: string;
    target: number;
    result: number;
    passed: number;
    failed: number;
    pending: number;
    count: number;
    rate: number;
    fillRate: number;
  }>;
  catColor: string;
}

export function CategoryCharts({ catStats, deptBreakdown, catColor }: CategoryChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievement Pie Chart */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5" style={{ color: catColor }} />
              <h3 className="font-semibold text-gray-900">Achievement Distribution</h3>
            </div>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-8 border-gray-200" style={{ borderTopColor: catColor, borderRightColor: catColor }}></div>
                <p className="mt-4 text-sm text-gray-500">Chart visualization</p>
                <p className="text-xs text-gray-400 mt-1">Achieved: {catStats.passedCount} | Missed: {catStats.failedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Performance Chart */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <LineChart className="w-5 h-5" style={{ color: catColor }} />
              <h3 className="font-semibold text-gray-900">Department Performance</h3>
            </div>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="flex items-end gap-2 h-32">
                  {deptBreakdown.slice(0, 6).map((dept, idx) => (
                    <div key={dept.name} className="flex flex-col items-center gap-1">
                      <div
                        className="w-8 bg-gradient-to-t"
                        style={{
                          height: `${(dept.rate / 100) * 100}px`,
                          background: `linear-gradient(to top, ${catColor}, ${catColor}40)`,
                        }}
                      ></div>
                      <span className="text-xs text-gray-500 max-w-[60px] truncate">{dept.name}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-gray-500">Performance by department</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5" style={{ color: catColor }} />
            <h3 className="font-semibold text-gray-900">Monthly Trend Analysis</h3>
          </div>
          <div className="h-48 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="flex items-center gap-1">
                {MONTHS.slice(0, 6).map((month, idx) => (
                  <div key={month.value} className="flex flex-col items-center gap-1">
                    <div
                      className="w-6 bg-gradient-to-t"
                      style={{
                        height: `${Math.random() * 60 + 20}px`,
                        background: `linear-gradient(to top, ${catColor}, ${catColor}60)`,
                      }}
                    ></div>
                    <span className="text-xs text-gray-500">{month.label.slice(0, 3)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500">Monthly performance trend</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
