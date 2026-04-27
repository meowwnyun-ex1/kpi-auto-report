import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Target } from 'lucide-react';
import { KPI_CATEGORIES } from '../constants';

interface QuickStatsCardsProps {
  calculateCategoryStats: (categoryId: number) => { target: number; result: number; count: number };
  selectedCategory?: string;
}

export function QuickStatsCards({
  calculateCategoryStats,
  selectedCategory = 'all',
}: QuickStatsCardsProps) {
  // Filter categories based on selection
  const categoriesToShow =
    selectedCategory === 'all'
      ? KPI_CATEGORIES
      : KPI_CATEGORIES.filter((cat) => cat.id === selectedCategory);

  const highPerformers = categoriesToShow.filter((cat) => {
    const stats = calculateCategoryStats(Number(cat.id));
    const achievement = stats.target > 0 ? (stats.result / stats.target) * 100 : 0;
    return achievement >= 90;
  }).length;

  const needAttention = categoriesToShow.filter((cat) => {
    const stats = calculateCategoryStats(Number(cat.id));
    const achievement = stats.target > 0 ? (stats.result / stats.target) * 100 : 0;
    return achievement < 60;
  }).length;

  const onTrack = categoriesToShow.filter((cat) => {
    const stats = calculateCategoryStats(Number(cat.id));
    const achievement = stats.target > 0 ? (stats.result / stats.target) * 100 : 0;
    return achievement >= 60 && achievement < 90;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50/80 flex items-center justify-center shadow-lg border border-emerald-100">
                <CheckCircle2 className="w-7 h-7 text-emerald-700" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">High Performers</p>
                <p className="text-sm text-gray-600">Excellent progress</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-emerald-700">{highPerformers}</div>
              <p className="text-xs text-emerald-600 font-medium">categories</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-emerald-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${(highPerformers / categoriesToShow.length) * 100}%` }}></div>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {((highPerformers / categoriesToShow.length) * 100).toFixed(0)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50/80 flex items-center justify-center shadow-lg border border-amber-100">
                <AlertTriangle className="w-7 h-7 text-amber-700" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Need Attention</p>
                <p className="text-sm text-gray-600">Below target</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-amber-700">{needAttention}</div>
              <p className="text-xs text-amber-600 font-medium">categories</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                style={{ width: `${(needAttention / categoriesToShow.length) * 100}%` }}></div>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {((needAttention / categoriesToShow.length) * 100).toFixed(0)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-50/80 flex items-center justify-center shadow-lg border border-slate-100">
                <Target className="w-7 h-7 text-slate-700" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">On Track</p>
                <p className="text-sm text-gray-600">Good progress</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-slate-700">{onTrack}</div>
              <p className="text-xs text-slate-600 font-medium">categories</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-500 rounded-full transition-all duration-1000"
                style={{ width: `${(onTrack / categoriesToShow.length) * 100}%` }}></div>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {((onTrack / categoriesToShow.length) * 100).toFixed(0)}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
