import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';

interface OverviewSummaryCardProps {
  overallStats: {
    totalTargets: number;
    totalResult: number;
    overallRate: number;
    categoryCount: number;
  };
}

export function OverviewSummaryCard({ overallStats }: OverviewSummaryCardProps) {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">KPI Performance Overview</h2>
              <p className="text-sm text-gray-600">All Categories — FY {new Date().getFullYear()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {overallStats.overallRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">Overall Achievement</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="text-sm text-gray-600 mb-1">Total Targets</div>
            <div className="text-2xl font-bold text-gray-900">{overallStats.totalTargets.toLocaleString()}</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="text-sm text-gray-600 mb-1">Total Results</div>
            <div className="text-2xl font-bold text-green-600">{overallStats.totalResult.toLocaleString()}</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="text-sm text-gray-600 mb-1">Categories</div>
            <div className="text-2xl font-bold text-blue-600">{overallStats.categoryCount}</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="text-sm text-gray-600 mb-1">Gap</div>
            <div className={`text-2xl font-bold ${overallStats.totalResult >= overallStats.totalTargets ? 'text-green-600' : 'text-red-600'}`}>
              {(overallStats.totalResult - overallStats.totalTargets).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Overall Progress</span>
            <span className="text-sm font-medium text-gray-900">{overallStats.overallRate.toFixed(1)}%</span>
          </div>
          <Progress
            value={Math.min(100, overallStats.overallRate)}
            className="h-3"
            style={{
              '--progress-background': 'linear-gradient(to right, #3B82F6, #8B5CF6)',
              backgroundColor: '#E5E7EB',
            } as React.CSSProperties}
          />
        </div>
      </CardContent>
    </Card>
  );
}
