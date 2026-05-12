/**
 * MODERN DASHBOARD PAGE
 * แดชบอร์ดหลัก - ภาพรวม KPI
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useFiscalYearSelector } from '@/contexts/FiscalYearContext';
import { ModernShellLayout, ModernPageLayout } from '@/components/layout/modern-layout';
import { CATEGORY_COLORS } from '@/shared/styles/design-system';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface DashboardStats {
  totalKPIs: number;
  achieved: number;
  belowTarget: number;
  overallProgress: number;
}

interface CategorySummary {
  key: string;
  name: string;
  name_th: string;
  targetCount: number;
  achievedCount: number;
  progress: number;
  trend: 'up' | 'down' | 'stable';
}

// ============================================
// STAT CARD COMPONENT
// ============================================

const StatCard: React.FC<{
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
}> = ({ title, value, subtitle, icon: Icon, trend, trendValue, color }) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-4">
            {trend === 'up' ? (
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            ) : null}
            <span
              className={cn(
                'text-sm font-medium',
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              )}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================
// CATEGORY CARD COMPONENT
// ============================================

const CategoryCard: React.FC<{
  category: CategorySummary;
  onClick: () => void;
}> = ({ category, onClick }) => {
  const colors =
    CATEGORY_COLORS[category.key as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.compliance;

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden group">
      <div className="h-1.5 w-full" style={{ backgroundColor: colors.color }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: colors.color }}>
            {category.name_th[0]}
          </div>
          <Badge
            variant={category.progress >= 80 ? 'default' : 'secondary'}
            className={cn(
              category.progress >= 80 && 'bg-green-100 text-green-700',
              category.progress >= 50 && category.progress < 80 && 'bg-blue-100 text-blue-700',
              category.progress < 50 && 'bg-amber-100 text-amber-700'
            )}>
            {category.progress}%
          </Badge>
        </div>

        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
          {category.name_th}
        </h3>
        <p className="text-sm text-gray-500 mb-4">{category.name}</p>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ความสำเร็จ</span>
            <span className="font-medium text-gray-700">
              {category.achievedCount}/{category.targetCount}
            </span>
          </div>
          <Progress value={category.progress} className="h-2" />

          <div className="flex items-center gap-2 pt-2">
            {category.trend === 'up' && <ArrowUpRight className="w-4 h-4 text-green-600" />}
            {category.trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-600" />}
            <span
              className={cn(
                'text-xs font-medium',
                category.trend === 'up'
                  ? 'text-green-600'
                  : category.trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              )}>
              {category.trend === 'up' ? 'เพิ่มขึ้น' : category.trend === 'down' ? 'ลดลง' : 'คงที่'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// ACTIVITY ITEM COMPONENT
// ============================================

const ActivityItem: React.FC<{
  type: 'success' | 'warning' | 'info';
  message: string;
  time: string;
}> = ({ type, message, time }) => {
  const icons = {
    success: CheckCircle,
    warning: AlertCircle,
    info: TrendingUp,
  };
  const colors = {
    success: 'text-green-600 bg-green-100',
    warning: 'text-amber-600 bg-amber-100',
    info: 'text-blue-600 bg-blue-100',
  };
  const Icon = icons[type];

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          colors[type]
        )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{message}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
};

// ============================================
// MAIN DASHBOARD PAGE
// ============================================

const ModernDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();

  const [stats, setStats] = useState<DashboardStats>({
    totalKPIs: 0,
    achieved: 0,
    belowTarget: 0,
    overallProgress: 0,
  });
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [activities, setActivities] = useState<
    { type: 'success' | 'warning' | 'info'; message: string; time: string }[]
  >([]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetch(`/api/dashboard/summary?fiscalYear=${fiscalYear}`);
        const data = await res.json();

        if (data.success) {
          setStats(data.stats);
          setCategories(data.categories);
          setActivities(data.activities || []);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Failed to load dashboard:', err);
        }
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
        setStats({
          totalKPIs: 0,
          achieved: 0,
          belowTarget: 0,
          overallProgress: 0,
        });
        setCategories([]);
        setActivities([]);
      }
    };
    loadDashboard();
  }, [fiscalYear]);

  return (
    <ModernShellLayout>
      <ModernPageLayout
        title="Dashboard"
        icon={LayoutDashboard}
        iconColor="text-blue-600"
        fiscalYear={fiscalYear}
        availableYears={availableYears}
        onFiscalYearChange={setFiscalYear}>
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="KPI ทั้งหมด"
              value={stats.totalKPIs}
              subtitle="รายการวัดผล"
              icon={Target}
              color="#3b82f6"
            />
            <StatCard
              title="บรรลุเป้าหมาย"
              value={stats.achieved}
              subtitle={`${Math.round((stats.achieved / stats.totalKPIs) * 100)}% ของทั้งหมด`}
              icon={CheckCircle}
              trend="up"
              trendValue="+5% จากเดือนที่แล้ว"
              color="#22c55e"
            />
            <StatCard
              title="ต่ำกว่าเป้า"
              value={stats.belowTarget}
              subtitle="ต้องการการดำเนินการ"
              icon={AlertCircle}
              trend="down"
              trendValue="-3% จากเดือนที่แล้ว"
              color="#f59e0b"
            />
            <StatCard
              title="ความคืบหน้าโดยรวม"
              value={stats.overallProgress}
              subtitle="ร้อยละความสำเร็จ"
              icon={TrendingUp}
              trend="up"
              trendValue="+2% จากเดือนที่แล้ว"
              color="#8b5cf6"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Cards - Takes up 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">หมวดหมู่ KPI</h2>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  ดูทั้งหมด
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.key}
                    category={category}
                    onClick={() => navigate(`/dashboard/${category.key}`)}
                  />
                ))}
              </div>
            </div>

            {/* Sidebar - Activity & Quick Actions */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">กิจกรรมล่าสุด</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {activities.map((activity, index) => (
                      <ActivityItem
                        key={index}
                        type={activity.type}
                        message={activity.message}
                        time={activity.time}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">ทำงานด่วน</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/yearly-targets')}>
                    <Target className="w-4 h-4 mr-2" />
                    กำหนดเป้าหมายรายปี
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/monthly-targets')}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    กระจายเป้าหมายรายเดือน
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/monthly-result')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    บันทึกผลลัพธ์
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ModernPageLayout>
    </ModernShellLayout>
  );
};

export default ModernDashboardPage;
