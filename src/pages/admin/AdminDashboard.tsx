import React from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Activity,
  Database,
  Server,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
} from 'recharts';

// Mock data for system statistics
const systemStats = {
  totalUsers: 156,
  activeUsers: 42,
  totalKPIEntries: 2453,
  todayEntries: 87,
  systemUptime: '99.8%',
  avgResponseTime: '124ms',
  dbSize: '2.4 GB',
  lastBackup: '2 hours ago',
};

// Mock data for user activity
const userActivityData = [
  { hour: '00:00', users: 5 },
  { hour: '04:00', users: 2 },
  { hour: '08:00', users: 28 },
  { hour: '12:00', users: 45 },
  { hour: '16:00', users: 52 },
  { hour: '20:00', users: 18 },
];

// Mock data for KPI entries by category
const kpiEntriesByCategory = [
  { name: 'Safety', count: 312, color: '#ef4444' },
  { name: 'Quality', count: 428, color: '#22c55e' },
  { name: 'Delivery', count: 356, color: '#3b82f6' },
  { name: 'Compliance', count: 289, color: '#8b5cf6' },
  { name: 'HR', count: 198, color: '#f59e0b' },
  { name: 'Cost', count: 267, color: '#6366f1' },
  { name: 'Environment', count: 324, color: '#14b8a6' },
  { name: 'Attractive', count: 279, color: '#ec4899' },
];

// Mock data for system performance
const performanceData = [
  { day: 'Mon', response: 118, cpu: 45, memory: 62 },
  { day: 'Tue', response: 125, cpu: 52, memory: 65 },
  { day: 'Wed', response: 132, cpu: 58, memory: 68 },
  { day: 'Thu', response: 121, cpu: 48, memory: 64 },
  { day: 'Fri', response: 115, cpu: 42, memory: 60 },
  { day: 'Sat', response: 98, cpu: 25, memory: 55 },
  { day: 'Sun', response: 95, cpu: 22, memory: 52 },
];

// Mock data for recent activities
const recentActivities = [
  { id: 1, action: 'User Login', user: 'john.doe@company.com', time: '2 min ago', status: 'success' },
  { id: 2, action: 'KPI Entry Updated', user: 'jane.smith@company.com', time: '5 min ago', status: 'success' },
  { id: 3, action: 'New User Created', user: 'admin@company.com', time: '15 min ago', status: 'success' },
  { id: 4, action: 'Data Export', user: 'manager@company.com', time: '32 min ago', status: 'success' },
  { id: 5, action: 'Failed Login Attempt', user: 'unknown@email.com', time: '1 hour ago', status: 'warning' },
];

// Mock data for role distribution
const roleDistribution = [
  { name: 'User', value: 120, color: '#3b82f6' },
  { name: 'Manager', value: 28, color: '#f59e0b' },
  { name: 'Admin', value: 6, color: '#22c55e' },
  { name: 'Super Admin', value: 2, color: '#8b5cf6' },
];

export default function AdminDashboard() {
  return (
    <ShellLayout variant="user">
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-sky-900">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              System Overview and Performance Statistics - Last Updated: {new Date().toLocaleString('en-US')}
            </p>
          </div>
        </div>

        {/* System Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users */}
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{systemStats.totalUsers}</div>
              <p className="text-xs text-blue-100 mt-1">{systemStats.activeUsers} active now</p>
              <Progress value={(systemStats.activeUsers / systemStats.totalUsers) * 100} className="mt-2 h-2 bg-blue-400/30" />
            </CardContent>
          </Card>

          {/* KPI Entries */}
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">KPI Entries</CardTitle>
              <Database className="h-5 w-5 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{systemStats.totalKPIEntries.toLocaleString()}</div>
              <p className="text-xs text-green-100 mt-1">{systemStats.todayEntries} entries today</p>
              <Progress value={(systemStats.todayEntries / 100) * 100} className="mt-2 h-2 bg-green-400/30" />
            </CardContent>
          </Card>

          {/* System Uptime */}
          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">System Uptime</CardTitle>
              <Server className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{systemStats.systemUptime}</div>
              <p className="text-xs text-purple-100 mt-1">Last 30 days</p>
              <Progress value={99.8} className="mt-2 h-2 bg-purple-400/30" />
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">Avg Response</CardTitle>
              <Activity className="h-5 w-5 text-amber-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{systemStats.avgResponseTime}</div>
              <p className="text-xs text-amber-100 mt-1">Database: {systemStats.dbSize}</p>
              <Progress value={62} className="mt-2 h-2 bg-amber-400/30" />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-sky-600" />
                User Activity (Today)
              </CardTitle>
              <CardDescription>Hourly active users throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Active Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* KPI Entries by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-sky-600" />
                KPI Entries by Category
              </CardTitle>
              <CardDescription>Total entries per KPI category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={kpiEntriesByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {kpiEntriesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* System Performance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-sky-600" />
                System Performance (Last 7 Days)
              </CardTitle>
              <CardDescription>Response time, CPU and memory usage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="response"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                    name="Response (ms)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cpu"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444' }}
                    name="CPU (%)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="memory"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e' }}
                    name="Memory (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-sky-600" />
                User Roles
              </CardTitle>
              <CardDescription>Distribution by role</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {roleDistribution.map((entry, index) => (
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

        {/* System Resources & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* System Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-sky-600" />
                System Resources
              </CardTitle>
              <CardDescription>Current resource utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* CPU Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">CPU Usage</span>
                    </div>
                    <span className="text-sm font-bold">42%</span>
                  </div>
                  <Progress value={42} className="h-2" />
                </div>

                {/* Memory Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Memory Usage</span>
                    </div>
                    <span className="text-sm font-bold">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>

                {/* Disk Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Disk Usage</span>
                    </div>
                    <span className="text-sm font-bold">55%</span>
                  </div>
                  <Progress value={55} className="h-2" />
                </div>

                {/* Network */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Network I/O</span>
                    </div>
                    <span className="text-sm font-bold">12 MB/s</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-sky-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      {activity.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.user}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{activity.time}</p>
                      <Badge
                        variant={activity.status === 'success' ? 'default' : 'secondary'}
                        className={
                          activity.status === 'success'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }>
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ShellLayout>
  );
}
