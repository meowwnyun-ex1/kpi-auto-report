import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  BarChart3,
  PieChart as PieChartIcon,
  Radar as RadarIcon,
} from 'lucide-react';

interface ChartsTabProps {
  categoryChartData: Array<{ name: string; Target: number; Result: number; Passed: number }>;
  statusPieData: Array<{ name: string; value: number; color: string }>;
  judgePieData: Array<{ name: string; value: number; color: string }>;
  radarData: Array<{ category: string; target: number; result: number; fullMark: number }>;
  targetByUnit?: Array<{
    unit: string;
    count: number;
    targetSum: number;
    resultSum: number;
    description: string;
  }>;
}

// Gauge Chart Component
const GaugeChart = ({
  value,
  title,
  subtitle,
  color = '#3B82F6',
}: {
  value: number;
  title: string;
  subtitle?: string;
  color?: string;
}) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 80) return '#22C55E';
    if (val >= 60) return '#F59E0B';
    if (val >= 40) return '#F97316';
    return '#EF4444';
  };

  const gaugeColor = getColor(value);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r="45" stroke="#E5E7EB" strokeWidth="10" fill="none" />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={gaugeColor}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: gaugeColor }}>
            {value.toFixed(0)}%
          </span>
        </div>
      </div>
      <p className="text-sm font-medium mt-2">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
};

// Stat Card Component
const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  return (
    <Card className="border-l-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' && <TrendingUp className={`h-4 w-4 ${trendColors.up}`} />}
            {trend === 'down' && <TrendingDown className={`h-4 w-4 ${trendColors.down}`} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}:{' '}
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ChartsTab({
  categoryChartData,
  statusPieData,
  judgePieData,
  radarData,
  targetByUnit = [],
}: ChartsTabProps) {
  // Calculate summary statistics
  const totalTarget = categoryChartData.reduce((sum, d) => sum + d.Target, 0);
  const totalResult = categoryChartData.reduce((sum, d) => sum + d.Result, 0);
  const totalPassed = categoryChartData.reduce((sum, d) => sum + d.Passed, 0);

  const completionRate = totalTarget > 0 ? (totalResult / totalTarget) * 100 : 0;
  const passRate = totalResult > 0 ? (totalPassed / totalResult) * 100 : 0;

  const totalJudge = judgePieData.reduce((sum, d) => sum + d.value, 0);
  const oRate =
    totalJudge > 0
      ? ((judgePieData.find((d) => d.name === 'O')?.value || 0) / totalJudge) * 100
      : 0;

  const totalDepts = statusPieData.reduce((sum, d) => sum + d.value, 0);
  const completeDepts = statusPieData.find((d) => d.name === 'Complete')?.value || 0;
  const deptCompleteRate = totalDepts > 0 ? (completeDepts / totalDepts) * 100 : 0;

  // Calculate total count from targetByUnit
  const totalTargetCount = targetByUnit.reduce((sum, d) => sum + d.count, 0);

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="bg-muted/50 p-1">
        <TabsTrigger value="overview" className="data-[state=active]:bg-white gap-1">
          <Gauge className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="performance" className="data-[state=active]:bg-white gap-1">
          <BarChart3 className="h-4 w-4" />
          Performance
        </TabsTrigger>
        <TabsTrigger value="distribution" className="data-[state=active]:bg-white gap-1">
          <PieChartIcon className="h-4 w-4" />
          Distribution
        </TabsTrigger>
        <TabsTrigger value="radar" className="data-[state=active]:bg-white gap-1">
          <RadarIcon className="h-4 w-4" />
          Radar
        </TabsTrigger>
      </TabsList>

      {/* Overview Tab - Performance Metrics */}
      <TabsContent value="overview" className="space-y-4">
        {/* Performance Gauges */}
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="h-5 w-5 text-blue-600" />
              Performance Gauges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
              <GaugeChart
                value={completionRate}
                title="Completion Rate"
                subtitle="Results vs Targets"
              />
              <GaugeChart value={passRate} title="Pass Rate" subtitle="O vs Results" />
              <GaugeChart value={oRate} title="Success Rate" subtitle="O vs Total Judge" />
              <GaugeChart
                value={deptCompleteRate}
                title="Dept Completion"
                subtitle="Complete vs Total"
              />
            </div>
          </CardContent>
        </Card>

        {/* Unit Breakdown Tabs */}
        {targetByUnit.length > 0 && (
          <Tabs defaultValue="targets" className="space-y-4">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="targets" className="data-[state=active]:bg-white gap-1">
                <Target className="h-4 w-4" />
                Target Types
              </TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-white gap-1">
                <TrendingUp className="h-4 w-4" />
                Results by Unit
              </TabsTrigger>
            </TabsList>

            {/* Target Types Tab */}
            <TabsContent value="targets">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Target Types Breakdown
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Breakdown by unit - {totalTargetCount} total targets
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {targetByUnit.map((item, idx) => {
                      const completionPct =
                        item.targetSum > 0 ? (item.resultSum / item.targetSum) * 100 : 0;
                      const getColor = (pct: number) => {
                        if (pct >= 80)
                          return {
                            bg: 'bg-green-50',
                            border: 'border-green-200',
                            text: 'text-green-700',
                            progress: '#22C55E',
                          };
                        if (pct >= 60)
                          return {
                            bg: 'bg-amber-50',
                            border: 'border-amber-200',
                            text: 'text-amber-700',
                            progress: '#F59E0B',
                          };
                        if (pct >= 40)
                          return {
                            bg: 'bg-orange-50',
                            border: 'border-orange-200',
                            text: 'text-orange-700',
                            progress: '#F97316',
                          };
                        return {
                          bg: 'bg-red-50',
                          border: 'border-red-200',
                          text: 'text-red-700',
                          progress: '#EF4444',
                        };
                      };
                      const colors = getColor(completionPct);

                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge variant="outline" className="text-xs mb-1">
                                {item.unit}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            </div>
                            <span className={`text-lg font-bold ${colors.text}`}>{item.count}</span>
                          </div>

                          <div className="space-y-2 mt-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Target:</span>
                              <span className="font-medium">{item.targetSum.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Result:</span>
                              <span className="font-medium text-green-600">
                                {item.resultSum.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Need:</span>
                              <span
                                className={`font-medium ${item.targetSum - item.resultSum > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {Math.max(0, item.targetSum - item.resultSum).toLocaleString()}
                              </span>
                            </div>

                            <div className="pt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Progress</span>
                                <span className={`text-xs font-bold ${colors.text}`}>
                                  {completionPct.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, completionPct)}%`,
                                    backgroundColor: colors.progress,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results by Unit Tab */}
            <TabsContent value="results">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Results Breakdown by Unit
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Results entered by unit type - {totalResult.toLocaleString()} total results
                  </p>
                </CardHeader>
                <CardContent>
                  {targetByUnit.some((item) => item.resultSum > 0) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {targetByUnit
                        .filter((item) => item.resultSum > 0)
                        .sort((a, b) => b.resultSum - a.resultSum)
                        .map((item, idx) => {
                          const completionPct =
                            item.targetSum > 0 ? (item.resultSum / item.targetSum) * 100 : 0;
                          const remaining = Math.max(0, item.targetSum - item.resultSum);

                          return (
                            <div
                              key={idx}
                              className="p-4 rounded-lg border bg-green-50 border-green-200">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <Badge variant="outline" className="text-xs mb-1 bg-green-100">
                                    {item.unit}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                </div>
                                <span className="text-lg font-bold text-green-700">
                                  {item.resultSum.toLocaleString()}
                                </span>
                              </div>

                              <div className="space-y-2 mt-3">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Results:</span>
                                  <span className="font-medium text-green-600">
                                    {item.resultSum.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Target:</span>
                                  <span className="font-medium">
                                    {item.targetSum.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Remaining:</span>
                                  <span
                                    className={`font-medium ${remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                    {remaining.toLocaleString()}
                                  </span>
                                </div>

                                <div className="pt-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-muted-foreground">
                                      Completion
                                    </span>
                                    <span className="text-xs font-bold text-green-700">
                                      {completionPct.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-green-500 transition-all duration-500"
                                      style={{
                                        width: `${Math.min(100, completionPct)}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No results entered yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </TabsContent>

      {/* Performance Tab - Category Bar Chart */}
      <TabsContent value="performance">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">KPI Performance by Category</CardTitle>
            <p className="text-xs text-muted-foreground">
              Comparison of targets, results, and achievements across categories
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
                data={categoryChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                <Bar
                  dataKey="Target"
                  fill="#3B82F6"
                  name="Target"
                  radius={[4, 4, 0, 0]}
                  barSize={50}
                />
                <Bar
                  dataKey="Result"
                  fill="#10B981"
                  name="Result"
                  radius={[4, 4, 0, 0]}
                  barSize={50}
                />
                <Line
                  type="monotone"
                  dataKey="Passed"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  name="Passed (O)"
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Distribution Tab - Pie Charts */}
      <TabsContent value="distribution">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Status Donut */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Department Status Distribution</CardTitle>
              <p className="text-xs text-muted-foreground">
                Overview of department completion status
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}>
                      {statusPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Status Summary */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
                {statusPieData.map((item) => (
                  <div key={item.name} className="text-center">
                    <div className="text-lg font-bold" style={{ color: item.color }}>
                      {item.value}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Judge Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Judge Distribution</CardTitle>
              <p className="text-xs text-muted-foreground">
                Achievement evaluation results (O = Pass, X = Fail)
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={judgePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}>
                      {judgePieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Judge Summary */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                {judgePieData.map((item) => (
                  <div key={item.name} className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                        style={{ backgroundColor: item.color }}>
                        {item.name}
                      </span>
                      <span className="text-xl font-bold">{item.value}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {totalJudge > 0 ? ((item.value / totalJudge) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Radar Tab */}
      <TabsContent value="radar">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Category Achievement Radar</CardTitle>
            <p className="text-xs text-muted-foreground">
              Multi-dimensional view of target vs result performance
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 30, bottom: 10 }}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#374151' }} />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                  />
                  <Radar
                    name="Target"
                    dataKey="target"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Result"
                    dataKey="result"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
