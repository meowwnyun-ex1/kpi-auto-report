import React from 'react';
import {
  Target,
  ChevronLeft,
  ChevronRight,
  Shield,
  Award,
  Truck,
  FileCheck,
  Users,
  Heart,
  Leaf,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  getCategoryPriorityColor,
  KPI_CATEGORY_PRIORITIES,
  getPriorityClasses,
} from '@/shared/constants/priority-colors';
import { PriorityValue, PriorityText } from '@/components/ui/priority-text';
import { useSystemStandards, useSystemValidation } from '@/shared/utils';
import { useUnifiedColors } from '@/shared/utils';

// Types
interface Category {
  id: number | string;
  key: string;
  name: string;
}

interface CatCardProps {
  c: Category;
  categoryTargetValues?: Record<string, number>;
  categoryTargetCounts?: Record<string, number>;
  categoryActualCounts?: Record<string, number>;
  statsLoading?: boolean;
  onClick?: () => void;
  catColor?: string;
  calculateCategoryStats?: (categoryId: number) => {
    target: number;
    result: number;
    count: number;
    resultCount?: number;
  };
  selectedCategory?: string;
  navigateTo?: (categoryId: string) => void;
}

// Category configuration
export const CAT: Record<string, { color: string; icon: any }> = {
  safety: { color: '#10B981', icon: Shield },
  quality: { color: '#3B82F6', icon: Award },
  delivery: { color: '#F59E0B', icon: Truck },
  compliance: { color: '#8B5CF6', icon: FileCheck },
  hr: { color: '#EC4899', icon: Users },
  attractive: { color: '#F97316', icon: Heart },
  environment: { color: '#84CC16', icon: Leaf },
  cost: { color: '#6B7280', icon: DollarSign },
};

export function CatCard({
  c,
  categoryTargetValues,
  categoryTargetCounts,
  categoryActualCounts,
  statsLoading = false,
  onClick,
  catColor,
  calculateCategoryStats,
  selectedCategory = 'all',
  navigateTo,
}: CatCardProps) {
  const cfg = CAT[c.key] ?? { color: catColor || '#6B7280', icon: Target };
  const Icon = cfg.icon;

  // Handle dashboard use case
  if (calculateCategoryStats) {
    const catStats = calculateCategoryStats(Number(c.id));
    // Calculate percentage based on items with results vs total items
    // If resultCount is not available, calculate it from result vs target values
    const resultCount =
      catStats.resultCount ||
      (catStats.target > 0 ? Math.ceil((catStats.result / catStats.target) * catStats.count) : 0);
    const achievement = catStats.count > 0 ? (resultCount / catStats.count) * 100 : 0;

    // Dashboard implementation
    const getTrendIcon = (achievement: number) => {
      if (achievement >= 100) return <TrendingUp className="w-4 h-4 text-green-500" />;
      if (achievement >= 80) return <Minus className="w-4 h-4 text-amber-500" />;
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    };

    const getPerformanceBadge = (achievement: number) => {
      if (achievement === 0)
        return <Badge className="bg-gray-50 text-gray-500 border-gray-200">No Data</Badge>;
      if (achievement >= 95)
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Excellent</Badge>
        );
      if (achievement >= 80)
        return <Badge className="bg-green-50 text-green-700 border-green-200">Good</Badge>;
      if (achievement >= 60)
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">On Track</Badge>;
      return <Badge className="bg-red-50 text-red-700 border-red-200">Needs Work</Badge>;
    };

    const getGradientColors = (color: string) => {
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };
      return {
        light: hexToRgba(color, 0.1),
        medium: hexToRgba(color, 0.2),
        border: color,
      };
    };

    const colors = getGradientColors(cfg.color);
    const hasData = catStats.target > 0;

    return (
      <Card
        className="group cursor-pointer transition-all duration-500 hover:shadow-xl hover:-translate-y-1 overflow-hidden border border-gray-200/60 bg-white/90 backdrop-blur-sm relative"
        style={{
          borderTop: `3px solid ${colors.border}`,
        }}
        onClick={() => navigateTo?.(String(c.id))}>
        {/* KPI Trend Indicator */}
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-white bg-white">
            {achievement >= 120 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : achievement >= 100 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : achievement >= 80 ? (
              <Minus className="w-4 h-4 text-blue-600" />
            ) : achievement >= 60 ? (
              <TrendingDown className="w-4 h-4 text-amber-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>

        {/* Card Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm bg-white border border-gray-200">
              <Icon className="w-5 h-5" style={{ color: colors.border }} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">{c.name}</h3>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-3 h-3 ${i < Math.round(achievement / 20) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                    viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-50 rounded-lg px-1 py-3 mb-3 mx-1">
            <div
              className="flex items-center justify-center text-lg font-normal whitespace-nowrap"
              style={{ color: colors.border }}>
              <>
                {window.location.pathname.includes('result') ? (
                  <>
                    {catStats.count > 0 && <span className="text-xs text-gray-400">Results</span>}
                    <span className="mx-3">
                      {catStats.count === 0 ? (
                        <span className="text-gray-400">No targets</span>
                      ) : (
                        <>
                          <span className={`${resultCount === 0 ? 'text-gray-400' : ''}`}>
                            {resultCount}
                          </span>
                          <span className="text-black">/</span>
                          <span
                            className={`text-red-600 ${catStats.count === 0 ? 'text-gray-400' : ''}`}>
                            {catStats.count}
                          </span>
                        </>
                      )}
                    </span>
                    {catStats.count > 0 && <span className="text-xs text-gray-400">Targets</span>}
                  </>
                ) : (
                  <>
                    <span className="mx-3">
                      {catStats.count === 0 ? (
                        <span className="text-gray-400">No targets</span>
                      ) : (
                        <span className="text-red-600">{catStats.count}</span>
                      )}
                    </span>
                    {catStats.count > 0 && <div className="text-xs text-gray-400">Targets</div>}
                  </>
                )}
              </>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Progress</span>
              <span className="text-xs font-bold" style={{ color: colors.border }}>
                {achievement.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={Math.min(100, achievement)}
              className="h-2"
              style={
                {
                  '--progress-background': colors.border,
                  backgroundColor: '#E5E7EB',
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs text-gray-600 font-medium">View Details</span>
          <ChevronRight className="w-3 h-3 text-gray-500 group-hover:text-gray-700 transition-colors" />
        </div>
        {statsLoading && <div className="absolute inset-0 bg-white/40 rounded-2xl" />}
      </Card>
    );
  }

  // Monthly pages use case - move variables inside component
  const targetCount = categoryTargetCounts?.[c.key] || 0;
  const actualCount = categoryActualCounts?.[c.key] || 0;

  // Calculate achievement percentage
  const achievement = targetCount > 0 ? (actualCount / targetCount) * 100 : 0;

  const getTrendIcon = (achievement: number) => {
    if (achievement >= 100) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (achievement >= 80) return <Minus className="w-4 h-4 text-amber-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getPerformanceBadge = (achievement: number) => {
    if (achievement === 0)
      return <Badge className="bg-gray-50 text-gray-500 border-gray-200">No Data</Badge>;
    if (achievement >= 95)
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Excellent</Badge>;
    if (achievement >= 80)
      return <Badge className="bg-green-50 text-green-700 border-green-200">Good</Badge>;
    if (achievement >= 60)
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200">On Track</Badge>;
    return <Badge className="bg-red-50 text-red-700 border-red-200">Needs Work</Badge>;
  };

  const getGradientColors = (color: string) => {
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    return {
      light: hexToRgba(color, 0.1),
      medium: hexToRgba(color, 0.2),
      border: color,
    };
  };

  const colors = getGradientColors(cfg.color);
  const hasData = targetCount > 0;

  return (
    <Card
      className="group cursor-pointer transition-all duration-500 hover:shadow-xl hover:-translate-y-1 overflow-hidden border border-gray-200/60 bg-white/90 backdrop-blur-sm relative"
      style={{
        borderTop: `3px solid ${colors.border}`,
      }}
      onClick={onClick}>
      {/* KPI Trend Indicator */}
      <div className="absolute top-3 right-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-white bg-white">
          {achievement >= 120 ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : achievement >= 100 ? (
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          ) : achievement >= 80 ? (
            <Minus className="w-4 h-4 text-blue-600" />
          ) : achievement >= 60 ? (
            <TrendingDown className="w-4 h-4 text-amber-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
        </div>
      </div>

      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm bg-white border border-gray-200">
            <Icon className="w-5 h-5" style={{ color: colors.border }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">{c.name}</h3>
            <div className="flex items-center gap-1">
              {achievement === 0
                ? [...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 text-gray-300" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))
                : [...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-3 h-3 ${i < Math.round(achievement / 20) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                      viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-lg px-1 py-3 mb-3 mx-1">
          <div
            className="flex items-center justify-center text-lg font-normal whitespace-nowrap"
            style={{ color: colors.border }}>
            <>
              {window.location.pathname.includes('result') ? (
                <>
                  {targetCount > 0 && <span className="text-xs text-gray-400">Results</span>}
                  <span className="mx-3">
                    {targetCount === 0 ? (
                      <span className="text-gray-400">No targets</span>
                    ) : (
                      <>
                        <span className={`${actualCount === 0 ? 'text-gray-400' : ''}`}>
                          {actualCount}
                        </span>
                        <span className="text-black">/</span>
                        <span
                          className={`text-red-600 ${targetCount === 0 ? 'text-gray-400' : ''}`}>
                          {targetCount}
                        </span>
                      </>
                    )}
                  </span>
                  {targetCount > 0 && <span className="text-xs text-gray-400">Targets</span>}
                </>
              ) : (
                <>
                  <span className="mx-3">
                    {targetCount === 0 ? (
                      <span className="text-gray-400">No targets</span>
                    ) : (
                      <span className="text-red-600">{targetCount}</span>
                    )}
                  </span>
                  {targetCount > 0 && <div className="text-xs text-gray-400">Targets</div>}
                </>
              )}
            </>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600">Progress</span>
            <span className="text-xs font-bold" style={{ color: colors.border }}>
              {achievement.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={Math.min(100, achievement)}
            className="h-2"
            style={
              {
                '--progress-background': colors.border,
                backgroundColor: '#E5E7EB',
              } as React.CSSProperties
            }
          />
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <span className="text-xs text-gray-600 font-medium">View Details</span>
        <ChevronRight className="w-3 h-3 text-gray-500 group-hover:text-gray-700 transition-colors" />
      </div>
      {statsLoading && <div className="absolute inset-0 bg-white/40 rounded-2xl" />}
    </Card>
  );
}
