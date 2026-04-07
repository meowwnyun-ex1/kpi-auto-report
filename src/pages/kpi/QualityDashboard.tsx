import React, { useEffect, useState } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
} from 'recharts';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  DollarSign,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Trendings,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types
interface QualityMetric {
  id: number;
  no: number;
  measurement: string;
  unit: string;
  main: string;
  main_relate: string;
  fy25_target: string;
  sub_category: string;
  sub_category_key: string;
  latest_entry?: {
    target: number;
    result: number;
    accu_target: number;
    accu_result: number;
    month: string;
    year: number;
  };
}

interface QualityDashboard {
  stats: {
    total_metrics: number;
    total_entries: number;
    total_products: number;
    years_covered: number;
  };
  claim_metrics: Array<{
    no: number;
    measurement: string;
    fy25_target: string;
    latest_accu_result: number;
  }>;
  loss_metrics: Array<{
    no: number;
    measurement: string;
    unit: string;
    fy25_target: string;
    latest_accu_result: number;
  }>;
  cost_of_spoilage_trend: Array<{
    month: string;
    year: number;
    target: number;
    result: number;
    accu_target: number;
    accu_result: number;
  }>;
}

const COLORS = {
  claim: '#ef4444',
  loss: '#f59e0b',
  target: '#94a3b8',
  result: '#3b82f6',
  good: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
};

const MONTHS_TH = [
  { key: 'Jan', name: 'ม.ค.' },
  { key: 'Feb', name: 'ก.พ.' },
  { key: 'Mar', name: 'มี.ค.' },
  { key: 'Apr', name: 'เม.ย.' },
  { key: 'May', name: 'พ.ค.' },
  { key: 'Jun', name: 'มิ.ย.' },
  { key: 'Jul', name: 'ก.ค.' },
  { key: 'Aug', name: 'ส.ค.' },
  { key: 'Sep', name: 'ก.ย.' },
  { key: 'Oct', name: 'ต.ค.' },
  { key: 'Nov', name: 'พ.ย.' },
  { key: 'Dec', name: 'ธ.ค.' },
];

export default function QualityDashboard() {
  const [dashboard, setDashboard] = useState<QualityDashboard | null>(null);
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(2025);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardRes, summaryRes] = await Promise.all([
        fetch('/api/kpi/quality/dashboard'),
        fetch('/api/kpi/quality/summary'),
      ]);

      if (!dashboardRes.ok || !summaryRes.ok) {
        throw new Error('Failed to fetch KPI data');
      }

      const dashboardData = await dashboardRes.json();
      const summaryData = await summaryRes.json();

      setDashboard(dashboardData);
      setMetrics(summaryData.metrics || []);
    } catch (err) {
      console.error('Error fetching Quality KPI:', err);
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Process trend data for charts
  const processTrendData = () => {
    if (!dashboard?.cost_of_spoilage_trend) return [];

    return dashboard.cost_of_spoilage_trend.map((item) => {
      const monthTh = MONTHS_TH.find((m) => m.key === item.month)?.name || item.month;
      return {
        ...item,
        monthTh,
        monthYear: `${monthTh} ${item.year + 543}`, // Buddhist year
        variance: item.result && item.target ? item.result - item.target : 0,
        achievement:
          item.target && item.result ? ((item.result / item.target) * 100).toFixed(1) : 0,
      };
    });
  };

  // Process claim metrics for chart
  const processClaimData = () => {
    if (!dashboard?.claim_metrics) return [];

    return dashboard.claim_metrics.map((metric) => ({
      name: metric.measurement,
      target: parseFloat(metric.fy25_target) || 0,
      actual: metric.latest_accu_result || 0,
      no: metric.no,
    }));
  };

  // Process loss metrics for chart
  const processLossData = () => {
    if (!dashboard?.loss_metrics) return [];

    return dashboard.loss_metrics.map((metric) => ({
      name: metric.measurement,
      unit: metric.unit,
      target: parseFloat(metric.fy25_target) || 0,
      actual: metric.latest_accu_result || 0,
      no: metric.no,
    }));
  };

  // Calculate summary statistics
  const calculateStats = () => {
    const claimData = processClaimData();
    const lossData = processLossData();

    const totalClaims = claimData.reduce((sum, item) => sum + (item.actual || 0), 0);
    const totalClaimTarget = claimData.reduce((sum, item) => sum + (item.target || 0), 0);

    const costOfSpoilage = lossData.find((d) => d.unit === 'MB');
    const qualityLoss = lossData.find((d) => d.name === 'Quality loss');

    return {
      totalClaims,
      totalClaimTarget,
      claimAchievement:
        totalClaimTarget > 0 ? ((totalClaims / totalClaimTarget) * 100).toFixed(1) : 0,
      costOfSpoilage: costOfSpoilage?.actual || 0,
      costTarget: costOfSpoilage?.target || 0,
      qualityLoss: qualityLoss?.actual || 0,
      qualityLossTarget: qualityLoss?.target || 0,
    };
  };

  if (loading) {
    return (
      <ShellLayout variant="user">
        <div className="flex-1 space-y-6 p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-sky-600" />
              <p className="text-muted-foreground">กำลังโหลดข้อมูล Quality KPI...</p>
            </div>
          </div>
        </div>
      </ShellLayout>
    );
  }

  if (error) {
    return (
      <ShellLayout variant="user">
        <div className="flex-1 space-y-6 p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold">เกิดข้อผิดพลาด</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                ลองใหม่
              </Button>
            </div>
          </div>
        </div>
      </ShellLayout>
    );
  }

  const stats = calculateStats();
  const trendData = processTrendData();
  const claimData = processClaimData();
  const lossData = processLossData();

  return (
    <ShellLayout variant="user">
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-sky-900 flex items-center gap-3">
                <Award className="h-8 w-8 text-green-600" />
                Quality KPI Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Quality Performance Indicators - Last Updated:{' '}
                {new Date().toLocaleDateString('en-US')}
              </p>
            </div>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Claims */}
          <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">Total Claims</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalClaims}</div>
              <p className="text-xs text-red-100 mt-1">Target: {stats.totalClaimTarget} cases</p>
              <Progress
                value={parseFloat(stats.claimAchievement)}
                className="mt-2 h-2 bg-red-400/30"
              />
            </CardContent>
          </Card>

          {/* Cost of Spoilage */}
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">Cost of Spoilage</CardTitle>
              <DollarSign className="h-5 w-5 text-amber-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.costOfSpoilage.toFixed(1)}</div>
              <p className="text-xs text-amber-100 mt-1">MB (Target: {stats.costTarget} MB)</p>
              <Progress
                value={(stats.costOfSpoilage / stats.costTarget) * 100}
                className="mt-2 h-2 bg-amber-400/30"
              />
            </CardContent>
          </Card>

          {/* Quality Loss */}
          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Quality Loss</CardTitle>
              <TrendingDown className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.qualityLoss.toFixed(1)}</div>
              <p className="text-xs text-purple-100 mt-1">
                MB (Target: {stats.qualityLossTarget} MB)
              </p>
              <Progress
                value={(stats.qualityLoss / stats.qualityLossTarget) * 100}
                className="mt-2 h-2 bg-purple-400/30"
              />
            </CardContent>
          </Card>

          {/* Metrics Count */}
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Total Metrics</CardTitle>
              <Target className="h-5 w-5 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{dashboard?.stats.total_metrics || 0}</div>
              <p className="text-xs text-green-100 mt-1">
                From {dashboard?.stats.years_covered || 0} years of data
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="claims" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Claims
            </TabsTrigger>
            <TabsTrigger value="losses" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Losses
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Cost of Spoilage Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-sky-600" />
                  Cost of Spoilage Trend (MB)
                </CardTitle>
                <CardDescription>Monthly performance comparison vs target</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="monthYear" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(2)} MB`,
                        name === 'target' ? 'Target' : name === 'result' ? 'Actual' : name,
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="accu_target"
                      stroke="#94a3b8"
                      fill="#94a3b8"
                      fillOpacity={0.2}
                      name="Cumulative Target"
                    />
                    <Bar dataKey="target" fill="#94a3b8" name="Target" radius={[4, 4, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="result"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                      name="Actual"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Target vs Result */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-sky-600" />
                    Target vs Result Comparison
                  </CardTitle>
                  <CardDescription>Monthly performance vs target</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="monthYear" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="target" fill="#94a3b8" name="Target" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="result" fill="#3b82f6" name="Actual" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Variance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-sky-600" />
                    Variance (Result - Target)
                  </CardTitle>
                  <CardDescription>
                    Difference from target (positive = above target, negative = below target)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="monthYear" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)} MB`, 'Variance']}
                      />
                      <Bar dataKey="variance" radius={[4, 4, 0, 0]}>
                        {trendData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.variance > 0 ? '#ef4444' : '#22c55e'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Claim Metrics Overview
                </CardTitle>
                <CardDescription>Customer complaint indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={claimData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#6b7280"
                      fontSize={11}
                      width={150}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="target" fill="#94a3b8" name="Target" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="actual" fill="#ef4444" name="Actual" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Claims Detail Table */}
            <Card>
              <CardHeader>
                <CardTitle>Claim Metrics Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">No.</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Measurement
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Target
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Actual
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {claimData.map((metric) => {
                        const isOverTarget = metric.actual > metric.target;
                        return (
                          <tr key={metric.no} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{metric.no}</td>
                            <td className="py-3 px-4">{metric.name}</td>
                            <td className="py-3 px-4 text-center">{metric.target}</td>
                            <td className="py-3 px-4 text-center font-bold text-red-600">
                              {metric.actual}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant={isOverTarget ? 'destructive' : 'default'}
                                className={
                                  isOverTarget
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                }>
                                {isOverTarget ? 'Above Target' : 'Within Target'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Losses Tab */}
          <TabsContent value="losses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                  Loss Metrics Overview
                </CardTitle>
                <CardDescription>Loss indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={lossData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="target" fill="#94a3b8" name="Target" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" fill="#f59e0b" name="Actual" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Loss Metrics Table */}
            <Card>
              <CardHeader>
                <CardTitle>รายละเอียด Loss Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">No.</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Measurement
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Unit</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Target
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Actual
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          % Achieved
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lossData.map((metric) => {
                        const achievement =
                          metric.target > 0
                            ? ((metric.actual / metric.target) * 100).toFixed(1)
                            : 0;
                        const isGood = parseFloat(achievement) <= 100;
                        return (
                          <tr key={metric.no} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{metric.no}</td>
                            <td className="py-3 px-4">{metric.name}</td>
                            <td className="py-3 px-4 text-center">{metric.unit}</td>
                            <td className="py-3 px-4 text-center">{metric.target}</td>
                            <td className="py-3 px-4 text-center font-bold text-amber-600">
                              {metric.actual?.toFixed(2) || '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant={isGood ? 'default' : 'destructive'}
                                className={
                                  isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }>
                                {achievement}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ShellLayout>
  );
}
