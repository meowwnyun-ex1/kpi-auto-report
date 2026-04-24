import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2, AlertTriangle, XCircle, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CategorySummaryCardsProps {
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
  catColor: string;
}

export function CategorySummaryCards({ catStats, catColor }: CategorySummaryCardsProps) {
  const getTrendIcon = (rate: number) => {
    if (rate >= 95) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rate >= 75) return <Minus className="w-4 h-4 text-amber-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card
          className="border-l-4 shadow-sm"
          style={{
            borderLeftColor: catColor,
            background: `linear-gradient(135deg, ${catColor}08, white)`,
          }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: catColor }}>Total Measurements</p>
                <p className="text-2xl font-bold text-gray-900">{catStats.totalTargets}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${catColor}15` }}>
                <Target className="w-5 h-5" style={{ color: catColor }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: '#16A34A', background: 'linear-gradient(135deg, #f0fdf4, white)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600">Achieved</p>
                <p className="text-2xl font-bold text-gray-900">{catStats.passedCount}</p>
                <p className="text-xs text-green-500">{catStats.passRate.toFixed(1)}% pass rate</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: '#F59E0B', background: 'linear-gradient(135deg, #fffbeb, white)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{catStats.pendingCount}</p>
                <p className="text-xs text-amber-500">{catStats.achievementRate.toFixed(1)}% filled</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: '#DC2626', background: 'linear-gradient(135deg, #fef2f2, white)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600">Missed</p>
                <p className="text-2xl font-bold text-gray-900">{catStats.failedCount}</p>
                <p className="text-xs text-red-500">{catStats.resultRate.toFixed(1)}% result rate</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Achievement Bar */}
      <Card className="shadow-sm" style={{ borderLeft: `4px solid ${catColor}` }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" style={{ color: catColor }} />
              <h3 className="font-semibold text-gray-900">Overall Achievement</h3>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(catStats.resultRate)}
              <span className="text-2xl font-bold" style={{ color: catColor }}>
                {catStats.resultRate.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
            <div className="text-center">
              <div className="text-gray-500">Target</div>
              <div className="font-mono font-bold text-gray-800">{catStats.totalTarget.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Result</div>
              <div className="font-mono font-bold" style={{ color: catColor }}>{catStats.totalResult.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Gap</div>
              <div className={`font-mono font-bold ${catStats.totalResult >= catStats.totalTarget ? 'text-green-600' : 'text-red-600'}`}>
                {(catStats.totalResult - catStats.totalTarget).toLocaleString()}
              </div>
            </div>
          </div>
          <Progress
            value={Math.min(100, catStats.resultRate)}
            className="h-3"
            style={{ '--progress-background': catColor, backgroundColor: '#E5E7EB' } as React.CSSProperties}
          />
        </CardContent>
      </Card>
    </div>
  );
}
