import React from 'react';
import { ShellLayout } from '@/components/layout';
import {
  Target,
  CalendarDays,
  BarChart3,
  Users,
  TrendingUp,
  PieChart,
  Activity,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import { MONTHS, KPI_CATEGORIES } from '../constants';
import { useDashboardData } from '../hooks/useDashboardData';

interface CompactDashboardProps {
  initialCategory?: string;
}

function CompactDashboard({ initialCategory }: CompactDashboardProps) {
  const {
    fiscalYear,
    setFiscalYear,
    availableYears,
    selectedMonth,
    setSelectedMonth,
    selectedDept,
    setSelectedDept,
    categories,
    loading,
    kpiStatus,
    summary,
    departmentData,
    calculateTotalTargets,
    calculateCategoryStats,
    refreshData,
  } = useDashboardData(initialCategory);

  // Calculate overall stats
  const overallStats = React.useMemo(() => {
    const totalTargets = calculateTotalTargets();
    let totalResult = 0;

    KPI_CATEGORIES.forEach((cat) => {
      const stats = calculateCategoryStats(Number(cat.id));
      totalResult += stats.result;
    });

    const overallRate = totalTargets > 0 ? (totalResult / totalTargets) * 100 : 0;

    return {
      totalTargets,
      totalResult,
      overallRate,
      categoryCount: KPI_CATEGORIES.length,
    };
  }, [calculateTotalTargets, calculateCategoryStats]);

  // Category performance summary
  const getCategoryPerformance = (categoryId: number) => {
    const stats = calculateCategoryStats(categoryId);
    const achievement = stats.target > 0 ? (stats.result / stats.target) * 100 : 0;
    return {
      ...stats,
      achievement,
      status:
        achievement === 0
          ? 'No Data'
          : achievement >= 95
            ? 'Excellent'
            : achievement >= 80
              ? 'Good'
              : achievement >= 60
                ? 'On Track'
                : 'Needs Work',
      statusColor:
        achievement === 0
          ? 'bg-gray-50 text-gray-500 border-gray-200'
          : achievement >= 95
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : achievement >= 80
              ? 'bg-green-50 text-green-700 border-green-200'
              : achievement >= 60
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-red-50 text-red-700 border-red-200',
    };
  };

  const highPerformers = KPI_CATEGORIES.filter((cat) => {
    const perf = getCategoryPerformance(Number(cat.id));
    return perf.achievement >= 90;
  }).length;

  const needAttention = KPI_CATEGORIES.filter((cat) => {
    const perf = getCategoryPerformance(Number(cat.id));
    return perf.achievement < 60;
  }).length;

  const onTrack = KPI_CATEGORIES.filter((cat) => {
    const perf = getCategoryPerformance(Number(cat.id));
    return perf.achievement >= 60 && perf.achievement < 90;
  }).length;

  return (
    <ShellLayout>
      <StandardPageLayout
        title="KPI Executive Dashboard"
        icon={Target}
        iconColor="text-gray-700"
        department={selectedDept === 'all' ? '' : selectedDept}
        fiscalYear={fiscalYear}
        availableYears={availableYears}
        onDepartmentChange={(value) => setSelectedDept(value === '' ? 'all' : value)}
        onFiscalYearChange={(value) => setFiscalYear(value)}
        onRefresh={refreshData}
        loading={loading}
        theme="gray"
        rightActions={
          <>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[120px] h-8 bg-gray-50 border-gray-200 text-gray-700 text-sm font-medium">
                <CalendarDays className="w-4 h-4 mr-2" />
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
          </>
        }>
        {/* Single Page Layout - No Scroll */}
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
          {/* Top Row: Summary Cards */}
          <div className="grid grid-cols-4 gap-4 flex-shrink-0">
            {/* Overall Achievement */}
            <Card className="border border-gray-200/60 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {overallStats.overallRate.toFixed(2)}%
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">Overall Achievement</div>
                <div className="text-xs text-gray-500">FY {new Date().getFullYear()}</div>
                <div className="mt-2">
                  <Progress value={Math.min(100, overallStats.overallRate)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* High Performers */}
            <Card className="border border-gray-200/60 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50/80 flex items-center justify-center border border-emerald-100">
                    <TrendingUp className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700">{highPerformers}</div>
                </div>
                <div className="text-sm font-medium text-gray-900">High Performers</div>
                <div className="text-xs text-gray-500">Excellent progress</div>
                <div className="mt-2">
                  <div className="flex-1 h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(highPerformers / KPI_CATEGORIES.length) * 100}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Need Attention */}
            <Card className="border border-gray-200/60 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-50/80 flex items-center justify-center border border-amber-100">
                    <Activity className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="text-2xl font-black text-amber-700">{needAttention}</div>
                </div>
                <div className="text-sm font-medium text-gray-900">Need Attention</div>
                <div className="text-xs text-gray-500">Below target</div>
                <div className="mt-2">
                  <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(needAttention / KPI_CATEGORIES.length) * 100}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* On Track */}
            <Card className="border border-gray-200/60 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-slate-50/80 flex items-center justify-center border border-slate-100">
                    <Users className="w-5 h-5 text-slate-700" />
                  </div>
                  <div className="text-2xl font-black text-slate-700">{onTrack}</div>
                </div>
                <div className="text-sm font-medium text-gray-900">On Track</div>
                <div className="text-xs text-gray-500">Good progress</div>
                <div className="mt-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full"
                      style={{ width: `${(onTrack / KPI_CATEGORIES.length) * 100}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom: Category Tabs */}
          <div className="flex-1 min-h-0">
            <Tabs defaultValue="summary" className="h-full flex flex-col">
              <TabsList className="bg-muted/50 p-1 h-8 flex-shrink-0">
                <TabsTrigger
                  value="summary"
                  className="data-[state=active]:bg-white h-6 px-3 text-xs">
                  Summary
                </TabsTrigger>
                {KPI_CATEGORIES.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="data-[state=active]:bg-white h-6 px-3 text-xs">
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary" className="flex-1 mt-2">
                <div className="h-full bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4 h-full">
                    {KPI_CATEGORIES.map((cat) => {
                      const Icon = cat.icon as any;
                      const perf = getCategoryPerformance(Number(cat.id));

                      return (
                        <Card
                          key={cat.id}
                          className="border border-gray-200/60 bg-white/80 hover:shadow-md transition-all cursor-pointer">
                          <CardContent className="p-3 h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                <Icon className="w-4 h-4" style={{ color: cat.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-gray-900 truncate">
                                  {cat.name}
                                </div>
                                <Badge className={`text-xs ${perf.statusColor}`}>
                                  {perf.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="text-2xl font-black text-gray-900 mb-1">
                              {perf.achievement.toFixed(2)}%
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div>
                                <div className="text-gray-600">Target</div>
                                <div className="font-bold text-gray-800">
                                  {perf.target.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-600">Result</div>
                                <div className="font-bold" style={{ color: cat.color }}>
                                  {perf.result.toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div className="mt-auto">
                              <Progress value={Math.min(100, perf.achievement)} className="h-2" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Individual Category Tabs */}
              {KPI_CATEGORIES.map((cat) => {
                const Icon = cat.icon as any;
                const perf = getCategoryPerformance(Number(cat.id));

                return (
                  <TabsContent key={cat.id} value={cat.id} className="flex-1 mt-2">
                    <div className="h-full bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-lg p-6">
                      <div className="h-full flex gap-6">
                        {/* Left: Category Details */}
                        <div className="w-1/3 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
                              <Icon className="w-8 h-8" style={{ color: cat.color }} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{cat.name}</h3>
                              <Badge className={`${perf.statusColor}`}>{perf.status}</Badge>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                              <div className="text-sm text-gray-600 mb-1">Target</div>
                              <div className="text-2xl font-bold text-gray-800">
                                {perf.target.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">Goals set</div>
                            </div>

                            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                              <div className="text-sm text-gray-600 mb-1">Result</div>
                              <div className="text-2xl font-bold" style={{ color: cat.color }}>
                                {perf.result.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">Achieved</div>
                            </div>

                            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                              <div className="text-sm text-gray-600 mb-1">Achievement Rate</div>
                              <div className="text-2xl font-black text-gray-900">
                                {perf.achievement.toFixed(2)}%
                              </div>
                              <div className="mt-2">
                                <Progress value={Math.min(100, perf.achievement)} className="h-3" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Performance Chart */}
                        <div className="flex-1 bg-white rounded-lg border border-gray-100/60 p-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                              <PieChart className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">
                                Performance Overview
                              </h4>
                              <p className="text-sm text-gray-600">Target vs Result</p>
                            </div>
                          </div>

                          <div className="h-48 flex items-end justify-center gap-4">
                            <div className="flex flex-col items-center gap-2 flex-1">
                              <div className="relative w-full flex justify-center">
                                <div
                                  className="w-8 bg-gradient-to-t rounded-t-lg transition-all duration-500"
                                  style={{
                                    height: `${perf.target > 0 ? Math.min(80, (perf.result / perf.target) * 80) : 20}px`,
                                    background: `linear-gradient(to top, ${cat.color}40, ${cat.color})`,
                                  }}></div>
                              </div>
                              <span className="text-xs text-gray-600 font-medium">Result</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 flex-1">
                              <div className="relative w-full flex justify-center">
                                <div
                                  className="w-8 bg-gradient-to-t rounded-t-lg transition-all duration-500 bg-gray-200"
                                  style={{
                                    height: `${Math.min(80, 80)}px`,
                                    background: `linear-gradient(to top, ${cat.color}20, ${cat.color}60)`,
                                  }}></div>
                              </div>
                              <span className="text-xs text-gray-600 font-medium">Target</span>
                            </div>
                          </div>

                          <div className="mt-6 flex items-center justify-center gap-8">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                              <span className="text-sm font-medium text-gray-600">
                                Achievement: {perf.achievement.toFixed(2)}%
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              <span className="text-slate-600 font-medium">
                                {perf.count} measurements tracked
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </div>
      </StandardPageLayout>
    </ShellLayout>
  );
}

export default CompactDashboard;
