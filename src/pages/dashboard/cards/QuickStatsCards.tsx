import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Target } from 'lucide-react';
import { KPI_CATEGORIES } from '../constants';

interface QuickStatsCardsProps {
  calculateCategoryStats: (categoryId: number) => { target: number; result: number; count: number };
  selectedCategory?: string;
}

export function QuickStatsCards({ calculateCategoryStats, selectedCategory = 'all' }: QuickStatsCardsProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-l-4 border-green-500 bg-gradient-to-r from-green-50/30 to-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">High Performers</p>
              <p className="text-xs text-gray-500">{highPerformers} categories</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-amber-500 bg-gradient-to-r from-amber-50/30 to-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Need Attention</p>
              <p className="text-xs text-gray-500">{needAttention} categories</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/30 to-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">On Track</p>
              <p className="text-xs text-gray-500">{onTrack} categories</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
