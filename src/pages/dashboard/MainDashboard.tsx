import React from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';

// KPI Categories Configuration
const KPI_CATEGORIES = [
  {
    id: 'safety',
    name: 'Safety',
    nameTh: 'ความปลอดภัย',
    icon: Shield,
    color: '#ef4444',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    target: 100,
    actual: 98.5,
    trend: 'up',
    status: 'good',
  },
  {
    id: 'quality',
    name: 'Quality',
    nameTh: 'คุณภาพ',
    icon: Award,
    color: '#22c55e',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    target: 99.5,
    actual: 99.2,
    trend: 'up',
    status: 'good',
  },
  {
    id: 'delivery',
    name: 'Delivery',
    nameTh: 'การส่งมอบ',
    icon: Truck,
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    target: 100,
    actual: 97.8,
    trend: 'down',
    status: 'warning',
  },
  {
    id: 'compliance',
    name: 'Compliance',
    nameTh: 'การปฏิบัติตามกฎระเบียบ',
    icon: Scale,
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    target: 100,
    actual: 100,
    trend: 'stable',
    status: 'good',
  },
  {
    id: 'hr',
    name: 'HR',
    nameTh: 'ทรัพยากรบุคคล',
    icon: Users,
    color: '#f59e0b',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    target: 95,
    actual: 92.3,
    trend: 'up',
    status: 'warning',
  },
  {
    id: 'attractive',
    name: 'Attractive',
    nameTh: 'ความน่าดึงดูด',
    icon: Heart,
    color: '#ec4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    target: 90,
    actual: 88.5,
    trend: 'up',
    status: 'warning',
  },
  {
    id: 'environment',
    name: 'Environment',
    nameTh: 'สิ่งแวดล้อม',
    icon: Leaf,
    color: '#14b8a6',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-700',
    target: 100,
    actual: 99.1,
    trend: 'up',
    status: 'good',
  },
  {
    id: 'cost',
    name: 'Cost',
    nameTh: 'ต้นทุน',
    icon: DollarSign,
    color: '#6366f1',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    target: 95,
    actual: 96.2,
    trend: 'up',
    status: 'good',
  },
];

// Mock data for charts
const monthlyTrendData = [
  { month: 'ม.ค.', safety: 97, quality: 98.5, delivery: 96, cost: 94 },
  { month: 'ก.พ.', safety: 97.5, quality: 98.8, delivery: 97, cost: 95 },
  { month: 'มี.ค.', safety: 98, quality: 99, delivery: 96.5, cost: 95.5 },
  { month: 'เม.ย.', safety: 98.2, quality: 99.1, delivery: 97, cost: 96 },
  { month: 'พ.ค.', safety: 98.5, quality: 99.2, delivery: 97.5, cost: 96.2 },
  { month: 'มิ.ย.', safety: 98.5, quality: 99.2, delivery: 97.8, cost: 96.2 },
];

const departmentComparisonData = [
  { department: 'Production', score: 96.5, fullMark: 100 },
  { department: 'Quality', score: 98.2, fullMark: 100 },
  { department: 'Logistics', score: 94.8, fullMark: 100 },
  { department: 'HR', score: 92.3, fullMark: 100 },
  { department: 'Finance', score: 97.1, fullMark: 100 },
  { department: 'Engineering', score: 95.6, fullMark: 100 },
];

const statusDistribution = [
  { name: 'Good', value: 5, color: '#22c55e' },
  { name: 'Warning', value: 3, color: '#f59e0b' },
  { name: 'Critical', value: 0, color: '#ef4444' },
];

const categoryBarData = KPI_CATEGORIES.map((cat) => ({
  name: cat.name,
  target: cat.target,
  actual: cat.actual,
  fill: cat.color,
}));

export default function MainDashboard() {
  const overallScore = KPI_CATEGORIES.reduce((sum, cat) => sum + cat.actual, 0) / KPI_CATEGORIES.length;
  const goodCount = KPI_CATEGORIES.filter((cat) => cat.status === 'good').length;
  const warningCount = KPI_CATEGORIES.filter((cat) => cat.status === 'warning').length;

  return (
    <ShellLayout variant="user">
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-sky-900">
              แดชบอร์ด KPI
            </h1>
            <p className="text-muted-foreground mt-1">
              ภาพรวมตัวชี้วัดองค์กร - อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}
            </p>
          </div>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Overall Score */}
          <Card className="bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-sky-100">คะแนนรวม</CardTitle>
              <Target className="h-5 w-5 text-sky-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{overallScore.toFixed(1)}%</div>
              <p className="text-xs text-sky-100 mt-1">เป้าหมายเฉลี่ย 97.4%</p>
              <Progress value={overallScore} className="mt-2 h-2 bg-sky-400/30" />
            </CardContent>
          </Card>

          {/* Good Status */}
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">ผ่านเกณฑ์</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{goodCount}</div>
              <p className="text-xs text-green-100 mt-1">จากทั้งหมด {KPI_CATEGORIES.length} ตัวชี้วัด</p>
            </CardContent>
          </Card>

          {/* Warning Status */}
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">ต้องปรับปรุง</CardTitle>
              <AlertTriangle className="h-5 w-5 text-amber-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{warningCount}</div>
              <p className="text-xs text-amber-100 mt-1">ตัวชี้วัดที่ต้องติดตาม</p>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">อัปเดตล่าสุด</CardTitle>
              <Clock className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <p className="text-xs text-purple-100 mt-1">
                {new Date().toLocaleDateString('th-TH', { weekday: 'long' })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* KPI Category Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {KPI_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const achievement = ((category.actual / category.target) * 100).toFixed(1);
            const TrendIcon = category.trend === 'up' ? TrendingUp : category.trend === 'down' ? TrendingDown : null;

            return (
              <Card
                key={category.id}
                className={`${category.bgColor} ${category.borderColor} border-2 hover:shadow-lg transition-all cursor-pointer`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium ${category.textColor}`}>
                    {category.name}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${category.bgColor}`}>
                    <Icon className={`h-4 w-4 ${category.textColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">{category.actual}%</div>
                    {TrendIcon && (
                      <Badge
                        variant={category.trend === 'up' ? 'default' : 'destructive'}
                        className="flex items-center gap-1"
                      >
                        <TrendIcon className="h-3 w-3" />
                        {category.trend === 'up' ? '+' : '-'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{category.nameTh}</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>เป้าหมาย: {category.target}%</span>
                      <span>{achievement}%</span>
                    </div>
                    <Progress
                      value={parseFloat(achievement)}
                      className="h-2"
                      style={{
                        backgroundColor: `${category.color}20`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Trend Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-sky-600" />
                แนวโน้มรายเดือน
              </CardTitle>
              <CardDescription>ผลการดำเนินงานตัวชี้วัดหลัก 6 เดือนที่ผ่านมา</CardDescription>
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
                เปรียบเทียบตามหมวดหมู่
              </CardTitle>
              <CardDescription>ผลการดำเนินงานเทียบกับเป้าหมายของแต่ละหมวด</CardDescription>
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
                  <Bar dataKey="target" fill="#e5e7eb" name="เป้าหมาย" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actual" fill="#3b82f6" name="ผลการดำเนินงาน" radius={[0, 4, 4, 0]}>
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
                ผลการดำเนินงานตามแผนก
              </CardTitle>
              <CardDescription>คะแนนรวมของแต่ละแผนก</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={departmentComparisonData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="department" stroke="#6b7280" fontSize={12} />
                  <PolarRadiusAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} />
                  <Radar
                    name="คะแนน"
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
                สถานะตัวชี้วัด
              </CardTitle>
              <CardDescription>การกระจายตามสถานะการดำเนินงาน</CardDescription>
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
                    label={({ name, value }) => `${name}: ${value}`}
                  >
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
              สรุปตัวชี้วัดทั้งหมด
            </CardTitle>
            <CardDescription>รายละเอียดผลการดำเนินงานของทุกตัวชี้วัด</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">หมวดหมู่</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ชื่อไทย</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">เป้าหมาย</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">ผลการดำเนินงาน</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">% บรรลุ</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">สถานะ</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">แนวโน้ม</th>
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
                        <td className="py-3 px-4 text-gray-600">{category.nameTh}</td>
                        <td className="py-3 px-4 text-center font-medium">{category.target}%</td>
                        <td className="py-3 px-4 text-center font-bold" style={{ color: category.color }}>
                          {category.actual}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={parseFloat(achievement) >= 95 ? 'default' : 'destructive'}>
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
                            }
                          >
                            {category.status === 'good' ? 'ผ่าน' : 'ต้องปรับปรุง'}
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
