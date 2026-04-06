import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { UnifiedError } from '@/components/ui/unified-error';
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
  ArrowRight,
  BarChart3,
  ClipboardList,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { KPI_CATEGORY_CONFIGS, KPIDashboardStats, getCategoryConfig } from '@/shared/types/kpi';
import { getApiUrl } from '@/config/api';

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

// Mock data generator
const generateMockStats = (): KPIDashboardStats[] => {
  return KPI_CATEGORY_CONFIGS.map((config) => {
    const achievement = Math.floor(Math.random() * 30) + 70; // 70-100
    return {
      category: config.key as any,
      total_metrics: Math.floor(Math.random() * 5) + 8,
      achieved_metrics: Math.floor(Math.random() * 5) + 4,
      warning_metrics: Math.floor(Math.random() * 2) + 1,
      critical_metrics: Math.floor(Math.random() * 2),
      overall_achievement: achievement,
      trend: achievement > 85 ? 'up' : achievement > 75 ? 'stable' : 'down',
      last_period_comparison: Math.random() * 10 - 3, // -3 to +7
    };
  });
};

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<KPIDashboardStats[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${getApiUrl()}/kpi/overview`);
      // const data = await response.json();

      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockStats = generateMockStats();
      setStats(mockStats);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load KPI overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Track page view
    fetch(`${getApiUrl()}/stats/page-views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 'kpi-home' }),
    }).catch(() => {});

    fetchData();
  }, [fetchData]);

  const renderTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getAchievementColor = (achievement: number) => {
    if (achievement >= 100) return 'text-green-600';
    if (achievement >= 80) return 'text-blue-600';
    if (achievement >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <ShellLayout variant="user" showContactWidget showStats={false}>
      <div className="min-h-screen space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KPI Auto Report</h1>
            <p className="text-sm text-gray-500 mt-1">ระบบรายงานผลการดำเนินงานอัตโนมัติ</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}
            </div>
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
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
        {!loading && !error && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-gray-600">ตัวชี้วัดทั้งหมด</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {stats.reduce((sum, s) => sum + s.total_metrics, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-white">
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-gray-600">บรรลุเป้าหมาย</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    {stats.reduce((sum, s) => sum + s.achieved_metrics, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-white">
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-gray-600">ต้องระวัง</div>
                  <div className="text-2xl font-bold text-yellow-600 mt-1">
                    {stats.reduce((sum, s) => sum + s.warning_metrics, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-white">
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-gray-600">วิกฤต</div>
                  <div className="text-2xl font-bold text-red-600 mt-1">
                    {stats.reduce((sum, s) => sum + s.critical_metrics, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* KPI Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {KPI_CATEGORY_CONFIGS.map((config) => {
                const categoryStats = stats.find((s) => s.category === config.key);
                const IconComponent = iconMap[config.icon];

                return (
                  <Card
                    key={config.key}
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => navigate(`/${config.key}`)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${config.color}20` }}>
                          <IconComponent className="h-5 w-5" style={{ color: config.color }} />
                        </div>
                        {categoryStats && renderTrendIcon(categoryStats.trend)}
                      </div>
                      <CardTitle className="text-lg mt-2">{config.name_th}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {config.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {categoryStats && (
                        <>
                          <div className="flex items-end justify-between mb-3">
                            <div>
                              <div className="text-xs text-gray-500">ผลการดำเนินงาน</div>
                              <div
                                className={`text-2xl font-bold ${getAchievementColor(categoryStats.overall_achievement)}`}>
                                {categoryStats.overall_achievement}%
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {categoryStats.achieved_metrics}/{categoryStats.total_metrics}{' '}
                              ตัวชี้วัด
                            </Badge>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${categoryStats.overall_achievement}%`,
                                backgroundColor:
                                  categoryStats.overall_achievement >= 80
                                    ? config.color
                                    : categoryStats.overall_achievement >= 60
                                      ? '#F59E0B'
                                      : '#EF4444',
                              }}
                            />
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/${config.key}`);
                              }}>
                              <BarChart3 className="h-3 w-3" />
                              ดูรายละเอียด
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">การดำเนินการด่วน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start gap-2"
                    onClick={() => navigate('/safety/entry')}>
                    <div className="flex items-center gap-2 w-full">
                      <ClipboardList className="h-5 w-5 text-red-500" />
                      <span className="font-semibold">กรอกข้อมูลวันนี้</span>
                    </div>
                    <span className="text-xs text-gray-500">บันทึกผลการดำเนินงานประจำวัน</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start gap-2"
                    onClick={() => navigate('/quality/dashboard')}>
                    <div className="flex items-center gap-2 w-full">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold">ดูรายงาน</span>
                    </div>
                    <span className="text-xs text-gray-500">ตรวจสอบผลการดำเนินงาน</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start gap-2"
                    onClick={() => navigate('/hr/dept')}>
                    <div className="flex items-center gap-2 w-full">
                      <Users className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold">ดูตามแผนก</span>
                    </div>
                    <span className="text-xs text-gray-500">ผลการดำเนินงานแยกตามแผนก</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ShellLayout>
  );
}
