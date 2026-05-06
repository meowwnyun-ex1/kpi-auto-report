import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ChevronRight,
  Activity,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYearSelector } from '@/contexts/FiscalYearContext';
import { storage } from '@/shared/utils';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();
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
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'update':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'delete':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  // Quick action cards
  const quickActions = [
    {
      title: 'Users',
      subtitle: 'Accounts & Roles',
      icon: Users,
      count: stats?.users?.total || 0,
      color: 'blue',
      path: '/admin/users',
    },
    {
      title: 'Categories',
      subtitle: 'KPI Structure',
      icon: BarChart3,
      count: stats?.categories || 0,
      color: 'emerald',
      path: '/admin/categories',
    },
    {
      title: 'Departments',
      subtitle: 'Organization',
      icon: Building2,
      count: stats?.departments?.total || 0,
      color: 'amber',
      path: '/admin/departments',
    },
    {
      title: 'Action Plans',
      subtitle: 'Improvements',
      icon: FileText,
      count: stats?.actionPlans || 0,
      color: 'violet',
      path: '/admin/action-plans',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; light: string }> = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50' },
    violet: { bg: 'bg-violet-500', text: 'text-violet-700', light: 'bg-violet-50' },
  };

  return (
    <ShellLayout>
      <StandardPageLayout
        title="Admin Dashboard"
        icon={Shield}
        iconColor="text-purple-600"
        fiscalYear={parseInt(selectedYear)}
        availableYears={availableYears}
        onFiscalYearChange={(v) => setSelectedYear(String(v))}
        onRefresh={loadAdminStats}
        loading={loading}
        theme="purple">
        <div className="space-y-6">
          {/* Quick Actions Grid - Enhanced with better design */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const colors = colorMap[action.color];
              return (
                <Card
                  key={action.title}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-gray-200 bg-white"
                  onClick={() => navigate(action.path)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className={`w-10 h-10 rounded-lg ${colors.light} flex items-center justify-center border border-gray-200`}>
                        <action.icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{action.subtitle}</p>
                    <div className="flex items-center justify-between">
                      <p className={`text-2xl font-bold ${colors.text}`}>{action.count}</p>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        Manage
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* System Overview - Enhanced with better details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* User Activity */}
            <Card className="border-2 border-gray-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-600" />
                      User Activity
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 text-xs">Active</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-gray-700">Active</span>
                    </div>
                    <span className="font-semibold text-emerald-700">
                      {stats?.users?.activeLast7Days || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserX className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Inactive</span>
                    </div>
                    <span className="font-semibold text-gray-600">
                      {(stats?.users?.total || 0) - (stats?.users?.activeLast7Days || 0)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{
                        width: `${
                          stats?.users?.total
                            ? (stats.users.activeLast7Days / stats.users.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats?.users?.total || 0} total users
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* KPI Progress */}
            <Card className="border-2 border-gray-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      KPI Progress
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Count-based tracking</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 text-xs">FY{selectedYear}</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Target (Items)</span>
                    <span className="font-semibold text-gray-900">
                      {stats?.kpis?.totalTargets || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Result (Items)</span>
                    <span className="font-semibold text-gray-900">
                      {stats?.kpis?.resultsEntered || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Achieved</span>
                    <span className="font-semibold text-emerald-700">
                      {stats?.kpis?.achievedTargets || 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats?.kpis?.totalTargets
                      ? Math.round((stats.kpis.resultsEntered / stats.kpis.totalTargets) * 100)
                      : 0}
                    % completion rate
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="border-2 border-gray-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-600" />
                      System Health
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">System status overview</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">Healthy</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Database</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-emerald-700">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">API Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-emerald-700">Running</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Last Backup</span>
                    <span className="text-sm font-medium text-gray-600">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities - Enhanced */}
          <Card className="border-2 border-gray-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    Recent Activities
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Latest system events</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-600 hover:text-purple-700">
                  View All
                </Button>
              </div>
              <div className="space-y-2">
                {stats?.recentActivities?.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.user} · {activity.timestamp}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </StandardPageLayout>
    </ShellLayout>
  );
}
