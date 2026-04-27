import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ShellLayout } from '@/components/layout';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  PieChart,
  Table as TableIcon,
  CalendarDays,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { KPI_CATEGORIES, MONTHS } from '../constants';
import { useFiscalYearSelector } from '@/shared/hooks/useFiscalYearSelector';
import { storage } from '@/shared/utils';
import { CategorySummaryCards } from '../cards/CategorySummaryCards';
import { DepartmentBreakdownCards } from '../cards/DepartmentBreakdownCards';
import { CategoryCharts } from '../charts/CategoryCharts';
import { CategoryDetailsTable } from '../tables/CategoryDetailsTable';

const VALID_CATEGORIES = KPI_CATEGORIES.map((c) => c.id);

interface CategoryDashboardProps {
  category?: string;
}

export function CategoryDashboard({ category: propCategory }: CategoryDashboardProps) {
  const params = useParams();
  const navigate = useNavigate();
  const category = propCategory || params.category;
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const m = new Date().getMonth() + 1;
    return m >= 4 ? m : m === 1 ? 4 : m + 3;
  });
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  // Validate category
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return <Navigate to="/dashboard" replace />;
  }

  const catConfig = KPI_CATEGORIES.find((c) => c.id === category)!;
  const CatIcon = catConfig.icon;
  const catColor = catConfig.color;

  // Fetch category-specific data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const overviewRes = await fetch(
          `/api/kpi-forms/overview/${fiscalYear}/${selectedMonth}?category=${category}`,
          { headers: { Authorization: `Bearer ${storage.getAuthToken()}` } }
        );
        const overviewData = await overviewRes.json();
        if (overviewData.success) {
          setDetails(overviewData.data?.details || []);
          setStatusData(overviewData.data?.status || []);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fiscalYear, selectedMonth, category]);

  // Category-level stats
  const catStats = useMemo(() => {
    const totalTargets = details.length;
    const filledCount = details.filter(
      (d: any) => d.result !== null && d.result !== undefined
    ).length;
    const passedCount = details.filter((d: any) => d.ev === 'O').length;
    const failedCount = details.filter((d: any) => d.ev === 'X').length;
    const pendingCount = totalTargets - filledCount;
    const achievementRate = totalTargets > 0 ? (filledCount / totalTargets) * 100 : 0;
    const passRate = filledCount > 0 ? (passedCount / filledCount) * 100 : 0;
    const totalTarget = details.reduce((s: number, d: any) => s + (d.target ?? 0), 0);
    const totalResult = details.reduce((s: number, d: any) => s + (d.result ?? 0), 0);
    const resultRate = totalTarget > 0 ? (totalResult / totalTarget) * 100 : 0;
    return {
      totalTargets,
      filledCount,
      passedCount,
      failedCount,
      pendingCount,
      achievementRate,
      passRate,
      totalTarget,
      totalResult,
      resultRate,
    };
  }, [details]);

  // Department breakdown for this category
  const deptBreakdown = useMemo(() => {
    const deptMap = new Map<
      string,
      {
        target: number;
        result: number;
        passed: number;
        failed: number;
        pending: number;
        count: number;
      }
    >();
    details.forEach((d: any) => {
      const name = d.department_name || d.department_id || 'Unknown';
      const existing = deptMap.get(name) || {
        target: 0,
        result: 0,
        passed: 0,
        failed: 0,
        pending: 0,
        count: 0,
      };
      deptMap.set(name, {
        target: existing.target + (d.target ?? 0),
        result: existing.result + (d.result ?? 0),
        passed: existing.passed + (d.ev === 'O' ? 1 : 0),
        failed: existing.failed + (d.ev === 'X' ? 1 : 0),
        pending: existing.pending + (d.result == null ? 1 : 0),
        count: existing.count + 1,
      });
    });
    return Array.from(deptMap.entries())
      .map(([name, data]) => ({
        name,
        ...data,
        rate: data.target > 0 ? (data.result / data.target) * 100 : 0,
        fillRate: data.count > 0 ? ((data.count - data.pending) / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [details]);

  const refreshData = () => {
    setLoading(true);
    fetch(`/api/kpi-forms/overview/${fiscalYear}/${selectedMonth}?category=${category}`, {
      headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setDetails(d.data?.details || []);
          setStatusData(d.data?.status || []);
        }
      })
      .finally(() => setLoading(false));
  };

  const getTrendIcon = (rate: number) => {
    if (rate >= 95) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rate >= 75) return <Minus className="w-4 h-4 text-amber-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (ev: string | null, result: any) => {
    if (result == null)
      return (
        <Badge variant="outline" className="text-gray-500 border-gray-300">
          Pending
        </Badge>
      );
    if (ev === 'O')
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Achieved</Badge>;
    if (ev === 'X') return <Badge className="bg-red-100 text-red-700 border-red-200">Missed</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Partial</Badge>;
  };

  return (
    <ShellLayout>
      <StandardPageLayout
        title={`${catConfig.name} Dashboard`}
        icon={CatIcon}
        iconColor={`text-[${catColor}]`}
        showBackButton
        onBackClick={() => navigate('/dashboard')}
        fiscalYear={fiscalYear}
        availableYears={availableYears}
        onFiscalYearChange={setFiscalYear}
        onRefresh={refreshData}
        loading={loading}
        rightActions={
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger
              className="w-[120px] h-9 text-sm border-gray-200"
              style={{ borderColor: `${catColor}40`, backgroundColor: `${catColor}08` }}>
              <CalendarDays className="w-4 h-4 mr-2" style={{ color: catColor }} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }>
        <div className="space-y-6">
          {/* Tab Navigation */}
          <Tabs defaultValue="cards" className="space-y-4">
            <TabsList className="bg-muted/50 p-1 h-10 w-fit">
              <TabsTrigger
                value="cards"
                className="data-[state=active]:bg-white h-8 px-4 text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger
                value="charts"
                className="data-[state=active]:bg-white h-8 px-4 text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Charts
              </TabsTrigger>
              <TabsTrigger
                value="table"
                className="data-[state=active]:bg-white h-8 px-4 text-sm flex items-center gap-2">
                <TableIcon className="w-4 h-4" />
                Table
              </TabsTrigger>
            </TabsList>

            {/* Cards Tab */}
            <TabsContent value="cards" className="space-y-6">
              <CategorySummaryCards catStats={catStats} catColor={catColor} />
              <DepartmentBreakdownCards deptBreakdown={deptBreakdown} catColor={catColor} />
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="charts" className="space-y-6">
              <CategoryCharts
                catStats={catStats}
                deptBreakdown={deptBreakdown}
                catColor={catColor}
              />
            </TabsContent>

            {/* Table Tab */}
            <TabsContent value="table" className="space-y-6">
              <CategoryDetailsTable
                details={details}
                catColor={catColor}
                CatIcon={CatIcon}
                catConfig={catConfig}
                loading={loading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </StandardPageLayout>
    </ShellLayout>
  );
}

export default CategoryDashboard;
