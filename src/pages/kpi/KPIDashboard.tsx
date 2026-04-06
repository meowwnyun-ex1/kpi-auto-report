import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UnifiedError } from '@/components/ui/unified-error';
import { 
  KPICategory, 
  KPISummary, 
  KPIDashboardStats, 
  KPIChartData,
  getCategoryConfig,
  getStatusColor,
  KPI_CATEGORY_CONFIGS 
} from '@/shared/types/kpi';
import { 
  Shield, 
  Award, 
  Truck, 
  FileCheck, 
  Users, 
  Star, 
  Leaf, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Calendar,
  Building2,
  ClipboardList,
  ArrowRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Award,
  Truck,
  FileCheck,
  Users,
  Star,
  Leaf,
  DollarSign,
};

// Mock data generator - will be replaced with API calls
const generateMockData = (category: KPICategory): { summaries: KPISummary[], stats: KPIDashboardStats, trendData: KPIChartData, breakdownData: KPIChartData } => {
  const config = getCategoryConfig(category);
  
  // Mock summaries
  const summaries: KPISummary[] = [
    {
      category,
      metric_name: `${config.name_th} Metric 1`,
      current_value: 95,
      target_value: 100,
      achievement_percentage: 95,
      trend: 'up',
      status: 'good',
      last_updated: new Date(),
      department_name: config.departments[0]
    },
    {
      category,
      metric_name: `${config.name_th} Metric 2`,
      current_value: 102,
      target_value: 100,
      achievement_percentage: 102,
      trend: 'up',
      status: 'excellent',
      last_updated: new Date(),
      department_name: config.departments[1]
    },
    {
      category,
      metric_name: `${config.name_th} Metric 3`,
      current_value: 75,
      target_value: 100,
      achievement_percentage: 75,
      trend: 'down',
      status: 'warning',
      last_updated: new Date(),
      department_name: config.departments[2]
    },
    {
      category,
      metric_name: `${config.name_th} Metric 4`,
      current_value: 55,
      target_value: 100,
      achievement_percentage: 55,
      trend: 'down',
      status: 'critical',
      last_updated: new Date(),
      department_name: config.departments[0]
    }
  ];

  // Mock stats
  const stats: KPIDashboardStats = {
    category,
    total_metrics: 10,
    achieved_metrics: 6,
    warning_metrics: 2,
    critical_metrics: 2,
    overall_achievement: 85,
    trend: 'up',
    last_period_comparison: 5.2
  };

  // Mock trend data
  const trendData: KPIChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Actual',
        data: [82, 85, 88, 83, 90, 85],
        borderColor: config.color,
        backgroundColor: `${config.color}20`,
        fill: true
      },
      {
        label: 'Target',
        data: [100, 100, 100, 100, 100, 100],
        borderColor: '#9CA3AF',
        backgroundColor: 'transparent',
        fill: false
      }
    ]
  };

  // Mock breakdown data
  const breakdownData: KPIChartData = {
    labels: config.departments.slice(0, 4),
    datasets: [
      {
        label: 'Achievement %',
        data: [92, 88, 75, 85],
        backgroundColor: config.color
      }
    ]
  };

  return { summaries, stats, trendData, breakdownData };
};

export const KPIDashboard: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [data, setData] = useState<{
    summaries: KPISummary[];
    stats: KPIDashboardStats;
    trendData: KPIChartData;
    breakdownData: KPIChartData;
  } | null>(null);

  // Validate category
  const validCategory = KPI_CATEGORY_CONFIGS.find(c => c.key === category);
  const categoryConfig = validCategory ? getCategoryConfig(validCategory.key as KPICategory) : null;

  const fetchData = useCallback(async () => {
    if (!validCategory) {
      setError('Invalid category');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/kpi/${category}?period=${period}`);
      // const data = await response.json();
      
      // Using mock data for now
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockData = generateMockData(validCategory.key as KPICategory);
      setData(mockData);
    } catch (err) {
      setError('Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  }, [validCategory, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!validCategory) {
    return (
      <ShellLayout variant="user" showStats={false}>
        <UnifiedError 
          type="404" 
          title="Category Not Found"
          message={`KPI category "${category}" does not exist.`}
        />
      </ShellLayout>
    );
  }

  const IconComponent = iconMap[categoryConfig?.icon || 'Shield'];

  const renderTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderStatusBadge = (status: 'excellent' | 'good' | 'warning' | 'critical') => {
    const colors = {
      excellent: 'bg-green-100 text-green-700 border-green-300',
      good: 'bg-blue-100 text-blue-700 border-blue-300',
      warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      critical: 'bg-red-100 text-red-700 border-red-300'
    };

    const labels = {
      excellent: 'ดีเยี่ยม',
      good: 'ดี',
      warning: 'ต้องระวัง',
      critical: 'วิกฤต'
    };

    return (
      <Badge variant="outline" className={colors[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <ShellLayout variant="user" showStats={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-lg" 
              style={{ backgroundColor: `${categoryConfig?.color}20` }}
            >
              <IconComponent 
                className="h-6 w-6" 
                style={{ color: categoryConfig?.color }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {categoryConfig?.name_th} Dashboard
              </h1>
              <p className="text-sm text-gray-500">{categoryConfig?.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">รายวัน</SelectItem>
                <SelectItem value="weekly">รายสัปดาห์</SelectItem>
                <SelectItem value="monthly">รายเดือน</SelectItem>
                <SelectItem value="quarterly">รายไตรมาส</SelectItem>
                <SelectItem value="yearly">รายปี</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button 
              onClick={() => navigate(`/${category}/entry`)}
              className="gap-2"
            >
              <ClipboardList className="h-4 w-4" />
              กรอกข้อมูล
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <UnifiedError 
            type="data-error"
            title="ไม่สามารถโหลดข้อมูลได้"
            message={error}
            showRetry
            onRetry={fetchData}
          />
        )}

        {/* Content */}
        {data && !loading && !error && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    ตัวชี้วัดทั้งหมด
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.stats.total_metrics}</div>
                  <p className="text-xs text-gray-500 mt-1">ตัวชี้วัด</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    บรรลุเป้าหมาย
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {data.stats.achieved_metrics}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">ตัวชี้วัด</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    ต้องระวัง/วิกฤต
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {data.stats.warning_metrics + data.stats.critical_metrics}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">ตัวชี้วัด</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    ผลการดำเนินงานรวม
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {data.stats.overall_achievement}%
                    </span>
                    {renderTrendIcon(data.stats.trend)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.stats.last_period_comparison > 0 ? '+' : ''}
                    {data.stats.last_period_comparison}% จากช่วงก่อน
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">แนวโน้มผลการดำเนินงาน</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.trendData.labels.map((label, i) => ({
                        name: label,
                        Actual: data.trendData.datasets[0].data[i],
                        Target: data.trendData.datasets[1].data[i]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 110]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="Actual" 
                          stroke={categoryConfig?.color}
                          strokeWidth={2}
                          dot={{ fill: categoryConfig?.color }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Target" 
                          stroke="#9CA3AF"
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Department Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ผลการดำเนินงานตามแผนก</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.breakdownData.labels.map((label, i) => ({
                        name: label,
                        value: data.breakdownData.datasets[0].data[i]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 110]} />
                        <Tooltip />
                        <Bar dataKey="value" fill={categoryConfig?.color}>
                          {data.breakdownData.datasets[0].data.map((value, index) => (
                            <Cell 
                              key={`cell-${index}`}
                              fill={value >= 100 ? '#10B981' : value >= 80 ? categoryConfig?.color : value >= 60 ? '#F59E0B' : '#EF4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">รายละเอียดตัวชี้วัด</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/${category}/dept`)}
                    className="gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    ดูตามแผนก
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">ตัวชี้วัด</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">แผนก</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">ค่าปัจจุบัน</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">เป้าหมาย</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">% บรรลุ</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">แนวโน้ม</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.summaries.map((summary, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{summary.metric_name}</td>
                          <td className="py-3 px-4 text-gray-600">{summary.department_name}</td>
                          <td className="py-3 px-4 text-right font-mono">{summary.current_value}</td>
                          <td className="py-3 px-4 text-right font-mono">{summary.target_value}</td>
                          <td className="py-3 px-4 text-right font-mono font-semibold">
                            {summary.achievement_percentage}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            {renderTrendIcon(summary.trend)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {renderStatusBadge(summary.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ShellLayout>
  );
};

export default KPIDashboard;
