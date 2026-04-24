import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Settings,
  Database,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Building2,
  Calendar,
  Target,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { storage } from '@/shared/utils';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';

interface AdminStats {
  fiscalYear: number;
  availableYears: number[];
  users: {
    total: number;
    admins: number;
    managers: number;
    regular: number;
    activeLast7Days: number;
  };
  kpis: {
    totalTargets: number;
    targetsSet: number;
    monthlyEntries: number;
    resultsEntered: number;
    achievedTargets: number;
    updatedLast7Days: number;
  };
  departments: {
    total: number;
    active: number;
  };
  categories: number;
  actionPlans: number;
  recentActivities?: Array<{
    id: number;
    action: string;
    user: string;
    timestamp: string;
    type: 'create' | 'update' | 'delete';
  }>;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYear();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(fiscalYear.toString());

  const canEdit = ['admin', 'superadmin'].includes(user?.role ?? '');

  useEffect(() => {
    loadAdminStats();
  }, [selectedYear]);

  const loadAdminStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/stats?year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'update':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'delete':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <ShellLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout>
      <StandardPageLayout
        title="Admin Dashboard"
        subtitle="System management and administration"
        icon={Settings}
        iconColor="text-purple-600"
        fiscalYear={parseInt(selectedYear)}
        availableYears={availableYears}
        onFiscalYearChange={(v) => setSelectedYear(String(v))}
        onRefresh={loadAdminStats}
        loading={loading}
        theme="purple">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Users className="w-5 h-5 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-800 text-xs">Users</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-900">{stats?.users?.total || 0}</div>
                <div className="text-xs text-blue-600">
                  {stats?.users?.activeLast7Days || 0} active this week
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Target className="w-5 h-5 text-green-600" />
                <Badge className="bg-green-100 text-green-800 text-xs">KPI Targets</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-900">
                  {stats?.kpis?.totalTargets || 0}
                </div>
                <div className="text-xs text-green-600">
                  {stats?.kpis?.monthlyEntries || 0} monthly entries
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <FileText className="w-5 h-5 text-purple-600" />
                <Badge className="bg-purple-100 text-purple-800 text-xs">Action Plans</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-900">{stats?.actionPlans || 0}</div>
                <div className="text-xs text-purple-600">Total plans</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Building2 className="w-5 h-5 text-orange-600" />
                <Badge className="bg-orange-100 text-orange-800 text-xs">Structure</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-900">
                  {stats?.departments?.total || 0}
                </div>
                <div className="text-xs text-orange-600">{stats?.categories || 0} categories</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                User Management
              </CardTitle>
              <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => (window.location.href = '/admin/users')}>
                  <Users className="w-4 h-4 mr-2" />
                  User Accounts
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => (window.location.href = '/admin/employees')}>
                  <Building2 className="w-4 h-4 mr-2" />
                  Employees
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* KPI Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                KPI Management
              </CardTitle>
              <CardDescription>Configure KPI categories, measurements, and data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => (window.location.href = '/admin/categories')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Categories
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => (window.location.href = '/admin/kpi-items')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Measurements
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              System Management
            </CardTitle>
            <CardDescription>System configuration and maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => (window.location.href = '/admin/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                System Settings
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => (window.location.href = '/admin/backup')}>
                <Database className="w-4 h-4 mr-2" />
                Data Backup
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => (window.location.href = '/admin/logs')}>
                <FileText className="w-4 h-4 mr-2" />
                System Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest system activities and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentActivities?.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">
                      {activity.user} · {activity.timestamp}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent activities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </StandardPageLayout>
    </ShellLayout>
  );
}
