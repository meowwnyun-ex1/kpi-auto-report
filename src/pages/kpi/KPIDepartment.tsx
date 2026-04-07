import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedError } from '@/components/ui/unified-error';
import {
  KPICategory,
  KPISummary,
  Department,
  getCategoryConfig,
  KPI_CATEGORY_CONFIGS,
} from '@/shared/types/kpi';
import {
  getKPIService,
  type KPIDataEntry,
  type Department as APIDepartment,
} from '@/services/kpi-service';
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
  Building2,
  ArrowRight,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
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

export const KPIDepartment: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<APIDepartment[]>([]);
  const [entries, setEntries] = useState<KPIDataEntry[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Validate category
  const validCategory = KPI_CATEGORY_CONFIGS.find((c) => c.key === category);
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
      const kpiService = getKPIService(category!);

      // Fetch departments and entries from the dept routes
      const [deptsRes, entriesRes] = await Promise.all([
        kpiService.dept.getDepartments(),
        kpiService.dept.getEntries({ year: selectedYear }),
      ]);

      const deptsData = deptsRes.success ? deptsRes.data : [];
      const entriesData = entriesRes.success ? entriesRes.data : [];

      setDepartments(deptsData);
      setEntries(entriesData);
    } catch (err) {
      console.error('Failed to load department data:', err);
      setError('Failed to load department data');
    } finally {
      setLoading(false);
    }
  }, [validCategory, category, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Convert entries to summaries
  const summaries: KPISummary[] = entries.map((entry) => {
    const result = parseFloat(entry.result || '0');
    const target = parseFloat(entry.target || '100');
    const achievement = target > 0 ? Math.round((result / target) * 100) : 0;

    let status: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    if (achievement >= 100) status = 'excellent';
    else if (achievement >= 80) status = 'good';
    else if (achievement >= 60) status = 'warning';
    else status = 'critical';

    return {
      category: category as KPICategory,
      metric_name: entry.measurement || `Metric ${entry.metric_id}`,
      current_value: result,
      target_value: target,
      achievement_percentage: achievement,
      trend: 'stable' as const,
      status,
      last_updated: new Date(),
      department_name: entry.department_name || entry.sub_category_name || 'N/A',
    };
  });

  // Filter summaries by department
  const filteredSummaries =
    selectedDept === 'all'
      ? summaries
      : summaries.filter((s) => s.department_name === selectedDept);

  // Calculate department averages
  const departmentAverages = departments.map((dept) => {
    const deptSummaries = summaries.filter((s) => s.department_name === dept.name_en);
    const avg =
      deptSummaries.length > 0
        ? Math.round(
            deptSummaries.reduce((sum, s) => sum + s.achievement_percentage, 0) /
              deptSummaries.length
          )
        : 0;

    return {
      name: dept.name_en,
      value: avg,
      fill:
        avg >= 100
          ? '#10B981'
          : avg >= 80
            ? categoryConfig?.color
            : avg >= 60
              ? '#F59E0B'
              : '#EF4444',
    };
  });

  // Radar chart data
  const radarData = departmentAverages.slice(0, 6).map((d) => ({
    department: d.name.substring(0, 10),
    achievement: d.value,
    fullMark: 100,
  }));

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
      critical: 'bg-red-100 text-red-700 border-red-300',
    };

    const labels = {
      excellent: 'ดีเยี่ยม',
      good: 'ดี',
      warning: 'ต้องระวัง',
      critical: 'วิกฤต',
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
              style={{ backgroundColor: `${categoryConfig?.color}20` }}>
              <IconComponent className="h-6 w-6" style={{ color: categoryConfig?.color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {categoryConfig?.name_th} by Department
              </h1>
              <p className="text-sm text-gray-500">Performance by Department</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name_en}>
                    {dept.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button onClick={() => navigate(`/${category}/entry`)} className="gap-2">
              <ClipboardList className="h-4 w-4" />
              กรอกข้อมูล
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
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
        {!loading && !error && (
          <>
            {/* Department Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {departmentAverages.slice(0, 5).map((dept, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedDept(dept.name)}>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-gray-600 truncate">{dept.name}</div>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="text-2xl font-bold" style={{ color: dept.fill }}>
                        {dept.value}%
                      </span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${dept.fill}20` }}>
                        {dept.value >= 80 ? (
                          <TrendingUp className="h-4 w-4" style={{ color: dept.fill }} />
                        ) : dept.value >= 60 ? (
                          <Minus className="h-4 w-4" style={{ color: dept.fill }} />
                        ) : (
                          <TrendingDown className="h-4 w-4" style={{ color: dept.fill }} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Comparison by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentAverages} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {departmentAverages.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Overall Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="department" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="Achievement %"
                          dataKey="achievement"
                          stroke={categoryConfig?.color}
                          fill={categoryConfig?.color}
                          fillOpacity={0.5}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Indicator Details {selectedDept !== 'all' && `- ${selectedDept}`}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/${category}/dashboard`)}
                    className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Main Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Indicator</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          Department
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">
                          Current Value
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Target</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">
                          % Achieved
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">Trend</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSummaries.map((summary, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{summary.metric_name}</td>
                          <td className="py-3 px-4 text-gray-600">{summary.department_name}</td>
                          <td className="py-3 px-4 text-right font-mono">
                            {summary.current_value}
                          </td>
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

                  {filteredSummaries.length === 0 && (
                    <div className="text-center py-8 text-gray-500">ไม่พบข้อมูล</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ShellLayout>
  );
};

export default KPIDepartment;
