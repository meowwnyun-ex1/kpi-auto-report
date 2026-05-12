import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ShellLayout } from '@/components/layout';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { KPI_CATEGORIES, MONTHS } from '../constants';
import { useFiscalYearSelector } from '@/contexts/FiscalYearContext';
import { storage } from '@/shared/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getCategoryTheme } from '@/shared/utils/category-theme';
import { ApiService } from '@/services/api-service';

const VALID_CATEGORIES = KPI_CATEGORIES.map((c) => c.id);

interface CategoryDashboardProps {
  category?: string;
}

function CategoryDashboard({ category: propCategory }: CategoryDashboardProps) {
  const params = useParams();
  const navigate = useNavigate();
  const category = propCategory || params.category;
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const m = new Date().getMonth() + 1;
    return m >= 4 ? m : m === 1 ? 4 : m + 3;
  });
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any[]>([]);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  // Validate category
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return <Navigate to="/dashboard" replace />;
  }

  const catConfig = KPI_CATEGORIES.find((c) => c.id === category)!;
  const CatIcon = catConfig.icon;
  const catColor = catConfig.color;
  const theme = getCategoryTheme(category);

  // Fetch category-specific data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const overviewData = await ApiService.get<any>(
          `/kpi-forms/overview/${fiscalYear}/${selectedMonth}`,
          {
            category,
          }
        );
        if (overviewData.success) {
          setDetails(overviewData.data?.details || []);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fiscalYear, selectedMonth, category]);

  // Category-level stats (count-based)
  const catStats = useMemo(() => {
    const targetCount = details.length; // Total items
    const resultCount = details.filter(
      (d: any) => d.result !== null && d.result !== undefined
    ).length; // Items with results
    const passedCount = details.filter((d: any) => d.status === 'achieved').length;
    const failedCount = details.filter((d: any) => d.status === 'not_achieved').length;
    const pendingCount = targetCount - resultCount;
    const achievementRate = targetCount > 0 ? (resultCount / targetCount) * 100 : 0;
    const passRate = resultCount > 0 ? (passedCount / resultCount) * 100 : 0;
    // Accumulated values by month
    const monthlyAccumulate = details.reduce(
      (acc: Record<number, { target: number; result: number }>, d: any) => {
        // Assuming d.month exists for monthly data
        const month = d.month || 0;
        if (!acc[month]) {
          acc[month] = { target: 0, result: 0 };
        }
        acc[month].target += d.target ?? 0;
        acc[month].result += d.result ?? 0;
        return acc;
      },
      {}
    );
    // Total accumulated values (for reference)
    const totalTargetValue = details.reduce((s: number, d: any) => s + (d.target ?? 0), 0);
    const totalResultValue = details.reduce((s: number, d: any) => s + (d.result ?? 0), 0);
    return {
      targetCount,
      resultCount,
      passedCount,
      failedCount,
      pendingCount,
      achievementRate,
      passRate,
      totalTargetValue,
      totalResultValue,
      monthlyAccumulate,
    };
  }, [details]);

  // Department breakdown for this category (count-based)
  const deptBreakdown = useMemo(() => {
    const deptMap = new Map<
      string,
      {
        targetCount: number;
        resultCount: number;
        passed: number;
        failed: number;
        pending: number;
        items: any[];
      }
    >();
    details.forEach((d: any) => {
      const name = d.department_name || d.department_id || 'Unknown';
      const existing = deptMap.get(name) || {
        targetCount: 0,
        resultCount: 0,
        passed: 0,
        failed: 0,
        pending: 0,
        items: [],
      };
      deptMap.set(name, {
        targetCount: existing.targetCount + 1,
        resultCount: existing.resultCount + (d.result != null ? 1 : 0),
        passed: existing.passed + (d.status === 'achieved' ? 1 : 0),
        failed: existing.failed + (d.status === 'not_achieved' ? 1 : 0),
        pending: existing.pending + (d.result == null ? 1 : 0),
        items: [...existing.items, d],
      });
    });
    return Array.from(deptMap.entries())
      .map(([name, data]) => ({
        name,
        ...data,
        rate: data.targetCount > 0 ? (data.resultCount / data.targetCount) * 100 : 0,
        fillRate:
          data.targetCount > 0 ? ((data.targetCount - data.pending) / data.targetCount) * 100 : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [details]);

  const refreshData = () => {
    setLoading(true);
    ApiService.get<any>(`/kpi-forms/overview/${fiscalYear}/${selectedMonth}`, { category })
      .then((d) => {
        if (d.success) setDetails(d.data?.details || []);
      })
      .finally(() => setLoading(false));
  };

  const getTrendIcon = (rate: number) => {
    if (rate >= 95) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (rate >= 75) return <Minus className="w-4 h-4 text-amber-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  return (
    <ShellLayout>
      <StandardPageLayout
        title={catConfig.name}
        icon={CatIcon}
        iconColor="text-gray-700"
        showBackButton
        onBackClick={() => navigate('/dashboard')}
        fiscalYear={fiscalYear}
        availableYears={availableYears}
        onFiscalYearChange={setFiscalYear}
        onRefresh={refreshData}
        loading={loading}
        theme="blue"
        rightActions={
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[130px] h-8 bg-white border-gray-200 text-sm">
              <CalendarDays className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }>
        <div className="space-y-6">
          {/* Hero Stats - Light background with dark text */}
          <div
            className="rounded-2xl border-2 p-6"
            style={{ backgroundColor: theme.lightBg, borderColor: theme.hex }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: theme.hex }}>
                  Overall Completion
                </p>
                <p className="text-5xl font-bold mt-1" style={{ color: theme.hex }}>
                  {catStats.achievementRate.toFixed(0)}%
                </p>
                <p className="text-sm mt-2 text-gray-700/80">
                  {catStats.resultCount} of {catStats.targetCount} items completed
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                  <p className="text-2xl font-bold text-emerald-700">{catStats.passedCount}</p>
                  <p className="text-xs text-gray-600">Passed</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <XCircle className="w-6 h-6 mx-auto mb-1 text-red-600" />
                  <p className="text-2xl font-bold text-red-700">{catStats.failedCount}</p>
                  <p className="text-xs text-gray-600">Failed</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <Clock className="w-6 h-6 mx-auto mb-1 text-amber-600" />
                  <p className="text-2xl font-bold text-amber-700">{catStats.pendingCount}</p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics Row - Enhanced with more details */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Target (Items)</span>
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{catStats.targetCount}</p>
                <p className="text-xs text-gray-500 mt-1">Total items</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Result (Items)</span>
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{catStats.resultCount}</p>
                <p className="text-xs text-gray-500 mt-1">Completed items</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Pass Rate</span>
                  {getTrendIcon(catStats.passRate)}
                </div>
                <p className="text-2xl font-bold text-gray-900">{catStats.passRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Success rate</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Accumulate</span>
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {catStats.totalResultValue.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total value</p>
              </CardContent>
            </Card>
          </div>

          {/* Department Breakdown - Accordion style */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Department Performance
            </h2>
            <div className="space-y-2">
              {deptBreakdown.map((dept) => {
                const isExpanded = expandedDept === dept.name;
                return (
                  <Card key={dept.name} className="border border-gray-100 overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedDept(isExpanded ? null : dept.name)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: theme.lightBg }}>
                            <Building2 className="w-4 h-4" style={{ color: theme.hex }} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{dept.name}</p>
                            <p className="text-xs text-gray-500">{dept.targetCount} items</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                              {dept.rate.toFixed(0)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {dept.resultCount} / {dept.targetCount}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(dept.rate)}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress value={dept.rate} className="h-1.5" />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                        <div className="grid grid-cols-4 gap-3 text-xs">
                          <div className="bg-emerald-50 rounded-lg p-2 text-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                            <p className="font-bold text-emerald-700">{dept.passed}</p>
                            <p className="text-emerald-600">Passed</p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-2 text-center">
                            <XCircle className="w-4 h-4 text-red-600 mx-auto mb-1" />
                            <p className="font-bold text-red-700">{dept.failed}</p>
                            <p className="text-red-600">Failed</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-2 text-center">
                            <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                            <p className="font-bold text-amber-700">{dept.pending}</p>
                            <p className="text-amber-600">Pending</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <BarChart3 className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                            <p className="font-bold text-blue-700">{dept.fillRate.toFixed(0)}%</p>
                            <p className="text-blue-600">Fill Rate</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </StandardPageLayout>
    </ShellLayout>
  );
}

export default CategoryDashboard;
