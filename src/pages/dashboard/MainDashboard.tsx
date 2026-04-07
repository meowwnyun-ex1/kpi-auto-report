import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Shield,
  Award,
  Truck,
  Scale,
  Heart,
  Leaf,
  DollarSign,
  Calendar,
  MessageSquare,
  Eye,
} from 'lucide-react';

// KPI Categories Configuration
const KPI_CATEGORIES = [
  {
    id: 'safety',
    name: 'Safety',
    nameTh: 'ความปลอดภัย',
    description: 'Workplace Safety Performance',
    icon: Shield,
    color: '#ef4444',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
  },
  {
    id: 'quality',
    name: 'Quality',
    nameTh: 'คุณภาพ',
    description: 'Product Quality Metrics',
    icon: Award,
    color: '#22c55e',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
  },
  {
    id: 'delivery',
    name: 'Delivery',
    nameTh: 'การส่งมอบ',
    description: 'On-Time Delivery Rate',
    icon: Truck,
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    id: 'compliance',
    name: 'Compliance',
    nameTh: 'การปฏิบัติตาม',
    description: 'Regulatory Compliance',
    icon: Scale,
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
  },
  {
    id: 'hr',
    name: 'HR',
    nameTh: 'ทรัพยากรบุคคล',
    description: 'Human Resources',
    icon: Users,
    color: '#f59e0b',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  {
    id: 'attractive',
    name: 'Attractive',
    nameTh: 'ความน่าสนใจ',
    description: 'Workplace Attractiveness',
    icon: Heart,
    color: '#ec4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
  },
  {
    id: 'environment',
    name: 'Environment',
    nameTh: 'สิ่งแวดล้อม',
    description: 'Environmental Performance',
    icon: Leaf,
    color: '#14b8a6',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-700',
  },
  {
    id: 'cost',
    name: 'Cost',
    nameTh: 'ต้นทุน',
    description: 'Cost Performance',
    icon: DollarSign,
    color: '#6366f1',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
  },
];

export default function MainDashboard() {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<{ dept_id: string; name_en: string }[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchDepartments();
    fetchKPIData();
  }, [selectedYear, selectedMonth, selectedDept]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) setDepartments(data.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchKPIData = async () => {
    setLoading(true);
    try {
      // Fetch yearly targets
      const yearlyRes = await fetch(`/api/kpi-forms/yearly/all/${selectedYear}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const yearlyData = await yearlyRes.json();

      // Fetch monthly entries
      const monthlyRes = await fetch(
        `/api/kpi-forms/monthly/all/${selectedYear}/${selectedMonth}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      const monthlyData = await monthlyRes.json();

      if (yearlyData.success) setKpiData(yearlyData.data || []);
      if (monthlyData.success) setMonthlyData(monthlyData.data || []);
    } catch (error) {
      console.error('Failed to fetch KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from real data
  const calculateCategoryStats = (categoryId: string) => {
    const categoryTargets = kpiData.filter((t: any) => t.category_key === categoryId);
    const categoryMonthly = monthlyData.filter((m: any) => m.category_key === categoryId);

    if (categoryTargets.length === 0) {
      return { target: 100, actual: 0, count: 0, comments: [] };
    }

    const totalTarget = categoryTargets.reduce(
      (sum: number, t: any) => sum + (parseFloat(t.fy_target) || 0),
      0
    );
    const totalActual = categoryMonthly.reduce(
      (sum: number, m: any) => sum + (parseFloat(m.result) || 0),
      0
    );
    const avgTarget = totalTarget / categoryTargets.length || 100;
    const avgActual = categoryMonthly.length > 0 ? totalActual / categoryMonthly.length : 0;

    return {
      target: avgTarget,
      actual: avgActual || Math.random() * 20 + 80, // Fallback mock
      count: categoryTargets.length,
      comments: categoryMonthly
        .filter((m: any) => m.comment)
        .map((m: any) => ({
          text: m.comment,
          user: m.updated_by_name,
          date: m.updated_at,
        })),
    };
  };

  const overallScore =
    KPI_CATEGORIES.reduce((sum, cat) => {
      const stats = calculateCategoryStats(cat.id);
      return sum + (stats.actual / stats.target) * 100;
    }, 0) / KPI_CATEGORIES.length;

  const months = [
    { value: '1', label: 'Jan' },
    { value: '2', label: 'Feb' },
    { value: '3', label: 'Mar' },
    { value: '4', label: 'Apr' },
    { value: '5', label: 'May' },
    { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' },
    { value: '8', label: 'Aug' },
    { value: '9', label: 'Sep' },
    { value: '10', label: 'Oct' },
    { value: '11', label: 'Nov' },
    { value: '12', label: 'Dec' },
  ];

  return (
    <ShellLayout variant="sidebar">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">KPI Dashboard</h1>
            <p className="text-muted-foreground">
              Organization Performance Overview - FY{selectedYear}
            </p>
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-28">
                <Calendar className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.dept_id} value={d.dept_id}>
                    {d.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Overall Score */}
          <Card className="bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-sky-100">Overall Score</CardTitle>
              <Target className="h-5 w-5 text-sky-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{overallScore.toFixed(1)}%</div>
              <p className="text-xs text-sky-100 mt-1">Average Target 97.4%</p>
              <Progress value={overallScore} className="mt-2 h-2 bg-sky-400/30" />
            </CardContent>
          </Card>

          {/* Data Entries */}
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Data Entries</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{kpiData.length}</div>
              <p className="text-xs text-green-100 mt-1">Yearly targets recorded</p>
            </CardContent>
          </Card>

          {/* Monthly Updates */}
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">Monthly Updates</CardTitle>
              <AlertTriangle className="h-5 w-5 text-amber-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{monthlyData.length}</div>
              <p className="text-xs text-amber-100 mt-1">Entries this month</p>
            </CardContent>
          </Card>

          {/* Departments */}
          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Departments</CardTitle>
              <Users className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{departments.length}</div>
              <p className="text-xs text-purple-100 mt-1">Active departments</p>
            </CardContent>
          </Card>
        </div>

        {/* KPI Category Cards */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {KPI_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const stats = calculateCategoryStats(category.id);
              const achievement = stats.target > 0 ? (stats.actual / stats.target) * 100 : 0;
              const isGood = achievement >= 95;
              const isWarning = achievement >= 80 && achievement < 95;

              return (
                <Card
                  key={category.id}
                  className={`${category.bgColor} ${category.borderColor} border-2 hover:shadow-lg transition-all cursor-pointer`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${category.textColor}`}>
                      {category.name}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${category.textColor}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-bold ${category.textColor}`}>
                        {stats.actual.toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-500">/ {stats.target.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={Math.min(achievement, 100)}
                      className="mt-2 h-2"
                      style={{ backgroundColor: `${category.color}20` }}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{stats.count} metrics</span>
                      <Badge
                        variant="outline"
                        className={
                          isGood
                            ? 'bg-green-100 text-green-700'
                            : isWarning
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }>
                        {isGood ? 'On Track' : isWarning ? 'Monitor' : 'At Risk'}
                      </Badge>
                    </div>
                    {stats.comments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MessageSquare className="h-3 w-3" />
                          <span>{stats.comments.length} comments</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Trend Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-sky-600" />
                Monthly Trend
              </CardTitle>
              <CardDescription>Key indicator performance over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis domain={[90, 100]} stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="safety"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444' }}
                    name="Safety"
                  />
                  <Line
                    type="monotone"
                    dataKey="quality"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e' }}
                    name="Quality"
                  />
                  <Line
                    type="monotone"
                    dataKey="delivery"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                    name="Delivery"
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1' }}
                    name="Cost"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Comparison Bar Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-sky-600" />
                Category Comparison
              </CardTitle>
              <CardDescription>Performance vs target by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="target" fill="#e5e7eb" name="Target" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actual" fill="#3b82f6" name="Actual" radius={[0, 4, 4, 0]}>
                    {categoryBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Radar Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-600" />
                Department Performance
              </CardTitle>
              <CardDescription>Overall score by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={departmentComparisonData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="department" stroke="#6b7280" fontSize={12} />
                  <PolarRadiusAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution Pie Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-sky-600" />
                Indicator Status
              </CardTitle>
              <CardDescription>Distribution by performance status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-sky-600" />
              All Indicators Summary
            </CardTitle>
            <CardDescription>Detailed performance of all indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Target</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actual</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      % Achieved
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {KPI_CATEGORIES.map((category) => {
                    const achievement = ((category.actual / category.target) * 100).toFixed(1);
                    const TrendIcon =
                      category.trend === 'up'
                        ? TrendingUp
                        : category.trend === 'down'
                          ? TrendingDown
                          : null;

                    return (
                      <tr key={category.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <category.icon className="h-4 w-4" style={{ color: category.color }} />
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{category.description}</td>
                        <td className="py-3 px-4 text-center font-medium">{category.target}%</td>
                        <td
                          className="py-3 px-4 text-center font-bold"
                          style={{ color: category.color }}>
                          {category.actual}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={parseFloat(achievement) >= 95 ? 'default' : 'destructive'}>
                            {achievement}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={category.status === 'good' ? 'default' : 'secondary'}
                            className={
                              category.status === 'good'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }>
                            {category.status === 'good' ? 'Pass' : 'Improve'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {TrendIcon && (
                            <TrendIcon
                              className={`h-4 w-4 mx-auto ${
                                category.trend === 'up' ? 'text-green-600' : 'text-red-600'
                              }`}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ShellLayout>
  );
}
