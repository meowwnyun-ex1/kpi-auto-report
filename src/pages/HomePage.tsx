import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShellLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  BarChart3,
  RefreshCw,
  Calendar,
  Eye,
  Target,
  LucideIcon,
} from 'lucide-react';
import { KPI_CATEGORIES, MONTHS } from '@/pages/dashboard/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYearSelector } from '@/contexts/FiscalYearContext';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import { TableContainer } from '@/shared/components/TableContainer';
import { storage } from '@/shared/utils/storage';

interface CategoryStats {
  category: string;
  name: string;
  totalMeasurements: number;
  achievedMeasurements: number;
  warningMeasurements: number;
  criticalMeasurements: number;
  achievementRate: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fiscalYear } = useFiscalYearSelector();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [selectedDept, setSelectedDept] = useState('all');
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load departments
      const deptRes = await fetch('/api/departments');
      const deptData = await deptRes.json();
      if (deptData.success) {
        setDepartments(deptData.data);
      }

      // Load real stats data from database for all departments
      const statsRes = await fetch(`/api/stats/all/${fiscalYear}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const statsData = await statsRes.json();

      if (statsData.success && statsData.data) {
        const categoryStats: CategoryStats[] = Object.entries(statsData.data).map(
          ([categoryKey, stat]: [string, any]) => {
            const config = KPI_CATEGORIES.find((c) => c.id === categoryKey);
            const totalMeasurements = stat.total_targets || 0;
            const totalResults = stat.total_results || 0;
            const achievementRate =
              totalMeasurements > 0 ? (totalResults / totalMeasurements) * 100 : 0;

            // Calculate warning and critical based on achievement rate
            const warningMeasurements =
              achievementRate < 80 && achievementRate >= 60
                ? Math.floor(totalMeasurements * 0.3)
                : 0;
            const criticalMeasurements =
              achievementRate < 60 ? Math.floor(totalMeasurements * 0.4) : 0;
            const achievedMeasurements =
              totalMeasurements - warningMeasurements - criticalMeasurements;

            return {
              category: categoryKey,
              name: config?.name || categoryKey,
              totalMeasurements,
              achievedMeasurements,
              warningMeasurements,
              criticalMeasurements,
              achievementRate,
              trend: achievementRate > 85 ? 'up' : achievementRate > 75 ? 'stable' : 'down',
              icon: config?.icon || Target,
              color: config?.color || '#6B7280',
            };
          }
        );

        setStats(categoryStats);
      } else {
        // No fallback - only use real data from API
        setStats([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-yellow-400 rounded-full" />;
    }
  };

  const getAchievementColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 75) return 'text-blue-600 bg-blue-50';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusBadge = (warning: number, critical: number) => {
    if (critical > 0)
      return <Badge className="bg-red-100 text-red-800 border-red-200">Critical {critical}</Badge>;
    if (warning > 0)
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning {warning}</Badge>
      );
    return <Badge className="bg-green-100 text-green-800 border-green-200">Normal</Badge>;
  };

  const totalStats = stats.reduce(
    (acc, stat) => ({
      totalMeasurements: acc.totalMeasurements + stat.totalMeasurements,
      achievedMeasurements: acc.achievedMeasurements + stat.achievedMeasurements,
      warningMeasurements: acc.warningMeasurements + stat.warningMeasurements,
      criticalMeasurements: acc.criticalMeasurements + stat.criticalMeasurements,
    }),
    {
      totalMeasurements: 0,
      achievedMeasurements: 0,
      warningMeasurements: 0,
      criticalMeasurements: 0,
    }
  );

  const overallAchievement =
    totalStats.totalMeasurements > 0
      ? Math.round((totalStats.achievedMeasurements / totalStats.totalMeasurements) * 100)
      : 0;

  return (
    <ShellLayout variant="user">
      <StandardPageLayout
        title="Measurement Management Dashboard"
        icon={BarChart3}
        iconColor="text-blue-600"
        onRefresh={loadData}
        loading={loading}
        theme="blue">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600">Measurements</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {totalStats.totalMeasurements}
                  </p>
                </div>
                <Target className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600">Achieved</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {totalStats.achievedMeasurements}
                  </p>
                </div>
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-600">Warning</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {totalStats.warningMeasurements}
                  </p>
                </div>
                <div className="h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">!</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-600">Critical</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {totalStats.criticalMeasurements}
                  </p>
                </div>
                <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">!</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Achievement */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Overall Performance</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Average achievement rate across all measurements
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-3xl font-bold ${getAchievementColor(overallAchievement).split(' ')[0]}`}>
                  {overallAchievement}%
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {totalStats.achievedMeasurements} / {totalStats.totalMeasurements} Measurements
                </div>
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${overallAchievement}%`,
                  backgroundColor:
                    overallAchievement >= 90
                      ? '#16A34A'
                      : overallAchievement >= 75
                        ? '#2563EB'
                        : overallAchievement >= 60
                          ? '#F59E0B'
                          : '#DC2626',
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Measurements Table */}
        <TableContainer
          icon={BarChart3}
          title="Measurement Summary by Category"
          totalCount={stats.length}
          countUnit="category"
          theme="blue"
          loading={loading}
          loadingRows={8}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 sticky top-0 z-10">
                <TableRow className="border-b border-gray-300">
                  <TableHead className="text-left py-2 bg-blue-50">Category</TableHead>
                  <TableHead className="text-center py-2 bg-blue-50">Measurements</TableHead>
                  <TableHead className="text-center py-2 bg-blue-50">Achieved</TableHead>
                  <TableHead className="text-center py-2 bg-blue-50">Warning</TableHead>
                  <TableHead className="text-center py-2 bg-blue-50">Critical</TableHead>
                  <TableHead className="text-center py-2 bg-blue-50">Achievement</TableHead>
                  <TableHead className="text-center py-2 bg-blue-50">Trend</TableHead>
                  <TableHead className="text-center py-2 bg-blue-50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat, index) => {
                  const Icon = stat.icon as LucideIcon;
                  return (
                    <TableRow
                      key={stat.category}
                      className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                      <TableCell className="font-medium py-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: `${stat.color}20` }}>
                            <Icon className="h-4 w-4" style={{ color: stat.color }} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{stat.name}</div>
                            <div className="text-xs text-gray-500">{stat.category}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <span className="font-semibold text-sm">{stat.totalMeasurements}</span>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <span className="font-semibold text-green-600 text-sm">
                          {stat.achievedMeasurements}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <span className="font-semibold text-yellow-600 text-sm">
                          {stat.warningMeasurements}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <span className="font-semibold text-red-600 text-sm">
                          {stat.criticalMeasurements}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <div className="flex items-center justify-center gap-1">
                          <div
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAchievementColor(stat.achievementRate)}`}>
                            {stat.achievementRate}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <div className="flex items-center justify-center">
                          {getTrendIcon(stat.trend)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <div className="flex items-center justify-center gap-1">
                          {getStatusBadge(stat.warningMeasurements, stat.criticalMeasurements)}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => navigate(`/dashboard?category=${stat.category}`)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TableContainer>
      </StandardPageLayout>
    </ShellLayout>
  );
}
