import React from 'react';
import { ShellLayout } from '@/components/layout';
import {
  Target,
  TrendingUp,
  CalendarDays,
  ChevronRight,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { MONTHS } from '../constants';
import { useDashboardData } from '../hooks/useDashboardData';
import { useNavigate } from 'react-router-dom';
import { getCategoryTheme } from '@/shared/utils/category-theme';

function MainDashboard({ initialCategory }: { initialCategory?: string } = {}) {
  const navigate = useNavigate();
  const {
    fiscalYear,
    setFiscalYear,
    availableYears,
    selectedMonth,
    setSelectedMonth,
    selectedDept,
    setSelectedDept,
    selectedCategory,
    setSelectedCategory,
    categories,
    loading,
    kpiStatus,
    summary,
    kpiData,
    calculateCategoryStats,
    refreshData,
  } = useDashboardData(initialCategory);

  const overviewMode = !initialCategory;
  const displayCategory = overviewMode ? 'all' : selectedCategory;

  // Calculate completion status (count by items, not values)
  const completionRate =
    summary.targetCount > 0 ? ((summary.resultCount / summary.targetCount) * 100).toFixed(0) : '0';

  // Get category stats for cards (count by items)
  const getCategoryCard = (cat: any) => {
    const stats = calculateCategoryStats(cat.id);
    const theme = getCategoryTheme(cat.key);
    // Use count-based completion (items filled / total items)
    const completion = stats.count > 0 ? ((stats.resultCount / stats.count) * 100).toFixed(0) : '0';

    return (
      <Card
        key={cat.id}
        className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: theme.lightBg }}>
              <Target className="w-5 h-5" style={{ color: theme.hex }} />
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </div>

          <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
          <p className="text-xs text-gray-500 mb-3">{stats.count} items</p>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Target</span>
              <span className="font-medium text-gray-700">{stats.count}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Result</span>
              <span className="font-medium text-gray-700">{stats.resultCount}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  backgroundColor: theme.hex,
                  width: `${Math.min(Number(completion), 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-sm font-bold" style={{ color: theme.hex }}>
                {completion}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Status summary
  const statusItems = [
    {
      label: 'Complete',
      value: summary.completeDepts,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'In Progress',
      value: summary.partialDepts,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Not Started',
      value: summary.missingDepts,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <ShellLayout>
      <StandardPageLayout
        title={
          overviewMode
            ? 'KPI Dashboard'
            : `${categories.find((c) => c.key === selectedCategory)?.name || 'Category'} Dashboard`
        }
        icon={Target}
        iconColor="text-blue-600"
        department={selectedDept === 'all' ? '' : selectedDept}
        fiscalYear={fiscalYear}
        availableYears={availableYears}
        onDepartmentChange={(value) => setSelectedDept(value === '' ? 'all' : value)}
        onFiscalYearChange={(value) => setFiscalYear(value)}
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
          {/* Key Metrics - Enhanced with light backgrounds and dark text */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-2 border-blue-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                      Targets
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {summary.targetCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Total items</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-emerald-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                      Results
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {summary.resultCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Completed items</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-violet-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-violet-700 uppercase tracking-wide">
                      Completion
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{completionRate}%</p>
                    <p className="text-xs text-gray-600 mt-1">Achievement rate</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center border border-violet-200">
                    <BarChart3 className="w-5 h-5 text-violet-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-amber-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                      Pass Rate
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {summary.passRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Success rate</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Status - Enhanced with better details */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Department Progress</h2>
                <p className="text-xs text-gray-500 mt-1">Overall status across all departments</p>
              </div>
              <div className="flex gap-6">
                {statusItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center border border-gray-200`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-lg font-bold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KPI Categories Grid - Enhanced with more context */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">KPI Categories</h2>
                <p className="text-xs text-gray-500 mt-1">Performance by category (count-based)</p>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {categories.length} categories
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat: any) => getCategoryCard(cat))}
            </div>
          </div>
        </div>
      </StandardPageLayout>
    </ShellLayout>
  );
}

export default MainDashboard;
