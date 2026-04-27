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
    <Card className="shadow-lg border border-gray-200/60 bg-white/90 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-50/80 backdrop-blur-sm flex items-center justify-center shadow-lg border border-gray-200">
              <BarChart3 className="w-8 h-8 text-gray-700" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">KPI Performance Overview</h2>
              <p className="text-gray-600 font-medium">FY {new Date().getFullYear()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-gray-900 mb-1">
              {overallStats.overallRate.toFixed(1)}%
            </div>
            <div className="text-gray-600 text-sm font-medium">Overall Achievement</div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200 hover:bg-gray-100/80 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200/80 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-700">T</span>
              </div>
              <div className="text-gray-600 text-sm font-medium">Total Targets</div>
            </div>
            <div className="text-3xl font-black text-gray-900">
              {overallStats.totalTargets.toLocaleString()}
            </div>
            <div className="text-gray-500 text-xs mt-1">All categories</div>
          </div>

          <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200 hover:bg-gray-100/80 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50/80 flex items-center justify-center">
                <span className="text-lg font-bold text-emerald-700">R</span>
              </div>
              <div className="text-gray-600 text-sm font-medium">Total Results</div>
            </div>
            <div className="text-3xl font-black text-emerald-700">
              {overallStats.totalResult.toLocaleString()}
            </div>
            <div className="text-emerald-600 text-xs mt-1">Achieved metrics</div>
          </div>

          <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200 hover:bg-gray-100/80 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50/80 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-700">C</span>
              </div>
              <div className="text-gray-600 text-sm font-medium">Categories</div>
            </div>
            <div className="text-3xl font-black text-slate-700">{overallStats.categoryCount}</div>
            <div className="text-slate-600 text-xs mt-1">Active categories</div>
          </div>

          <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200 hover:bg-gray-100/80 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50/80 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-700">G</span>
              </div>
              <div className="text-gray-600 text-sm font-medium">Gap Analysis</div>
            </div>
            <div
              className={`text-3xl font-black ${overallStats.totalResult >= overallStats.totalTargets ? 'text-emerald-700' : 'text-amber-700'}`}>
              {(overallStats.totalResult - overallStats.totalTargets).toLocaleString()}
            </div>
            <div
              className={`text-xs mt-1 ${overallStats.totalResult >= overallStats.totalTargets ? 'text-emerald-600' : 'text-amber-600'}`}>
              {overallStats.totalResult >= overallStats.totalTargets
                ? 'Above target'
                : 'Below target'}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-200/80 flex items-center justify-center">
                <div className="text-xl font-bold text-gray-700">%</div>
              </div>
              <div>
                <div className="text-gray-900 font-semibold">Overall Progress</div>
                <div className="text-gray-600 text-sm">Target vs Result</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-gray-900">
                {overallStats.overallRate.toFixed(1)}%
              </div>
              <div className="text-gray-600 text-sm">Completion Rate</div>
            </div>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gray-400 to-gray-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, overallStats.overallRate)}%` }}></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-gray-500 text-xs">0%</span>
              <span className="text-gray-500 text-xs">100%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
