import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { KPI_CATEGORIES } from '../constants';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CategoryCardsProps {
  calculateCategoryStats: (categoryId: number) => { target: number; result: number; count: number };
  selectedCategory?: string;
}

export function CategoryCards({ calculateCategoryStats, selectedCategory = 'all' }: CategoryCardsProps) {
  const navigate = useNavigate();

  // Filter categories based on selection
  const categoriesToShow =
    selectedCategory === 'all'
      ? KPI_CATEGORIES
      : KPI_CATEGORIES.filter((cat) => cat.id === selectedCategory);

  const getTrendIcon = (achievement: number) => {
    if (achievement >= 100) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (achievement >= 80) return <Minus className="w-4 h-4 text-amber-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getPerformanceBadge = (achievement: number) => {
    if (achievement >= 95) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Excellent</Badge>;
    if (achievement >= 80) return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Good</Badge>;
    if (achievement >= 60) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200">Needs Work</Badge>;
  };

  const getGradientColors = (color: string) => {
    // Convert hex to rgba for gradients
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {categoriesToShow.map((category, index) => {
        const Icon = category.icon as LucideIcon;
        const catStats = calculateCategoryStats(Number(category.id));
        const achievement = catStats.target > 0 ? (catStats.result / catStats.target) * 100 : 0;
        const colors = getGradientColors(category.color);
        const isTopPerformer = index === 0 && achievement >= 90;

        return (
          <Card
            key={category.id}
            className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden border-0"
            style={{
              background: `linear-gradient(135deg, ${colors.light}, white)`,
              borderTop: `3px solid ${colors.border}`,
            }}
            onClick={() => navigate(`/dashboard/${category.id}`)}>
            {/* Card Header */}
            <div className="p-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: colors.medium }}>
                    <Icon className="w-5 h-5" style={{ color: colors.border }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{category.name}</h3>
                    <p className="text-xs text-gray-500">{catStats.count} measurements</p>
                  </div>
                </div>
                {isTopPerformer && (
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                    Top
                  </Badge>
                )}
              </div>

              {/* Achievement Display */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getTrendIcon(achievement)}
                  <span className="text-xs text-gray-500">Achievement</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black" style={{ color: colors.border }}>
                    {achievement.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">Target</div>
                  <div className="font-mono font-bold text-gray-800 text-sm">
                    {catStats.target.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">Result</div>
                  <div className="font-mono font-bold text-sm" style={{ color: colors.border }}>
                    {catStats.result.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Progress</span>
                  {getPerformanceBadge(achievement)}
                </div>
                <Progress
                  value={Math.min(100, achievement)}
                  className="h-2"
                  style={{
                    '--progress-background': colors.border,
                    backgroundColor: '#E5E7EB',
                  } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Card Footer */}
            <div
              className="px-4 py-3 border-t border-gray-100/50 bg-white/40 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">View Details</span>
                <div className="flex items-center gap-1 text-gray-400 group-hover:text-blue-500 transition-colors">
                  <span>Explore</span>
                  <TrendingUp className="w-3 h-3" />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
