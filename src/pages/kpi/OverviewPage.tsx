import React, { useState, useEffect, useMemo } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  X,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Activity,
  CalendarDays,
} from 'lucide-react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';
import { KPIDetailTable } from './overview/KPIDetailTable';
import { ChartsTab } from './overview/ChartsTab';
import { DepartmentTab } from './overview/DepartmentTab';
import { MissingTab } from './overview/MissingTab';
import type {
  Category,
  KPIStatus,
  KPIDetail,
  Summary,
  DepartmentData,
  ColumnFilters,
} from './overview/types';

// Constants
const MONTHS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
];

export default function OverviewPage() {
  // Get fiscal year from context
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYear();

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [kpiStatus, setKpiStatus] = useState<KPIStatus[]>([]);
  const [kpiDetails, setKpiDetails] = useState<KPIDetail[]>([]);
  const [loading, setLoading] = useState(false);

  // Table controls
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    department: '',
    measurement: '',
    unit: '',
    judge: '',
    accu_judge: '',
  });

  // Fetch on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchKPIStatus(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fiscalYear, selectedMonth, selectedCategory]);

  useEffect(() => {
    fetchKPIStatus();
  }, [fiscalYear, selectedMonth, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/kpi-forms/categories');
      const data = await res.json();
      // Backend returns { success: true, data: [...] }
      setCategories(data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchKPIStatus = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/kpi-forms/overview/${fiscalYear}/${selectedMonth}`);
      const data = await res.json();
      // Backend returns { success: true, data: { status: [...], details: [...] } }
      setKpiStatus(data.data?.status || []);
      setKpiDetails(data.data?.details || []);
    } catch (error) {
      console.error('Failed to fetch KPI status:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Summary calculations
  const summary: Summary = useMemo(() => {
    const targetCount = kpiDetails.length;
    const resultCount = kpiDetails.filter(
      (d) => d.result !== null && d.result !== undefined
    ).length;
    const passedItems = kpiDetails.filter((d) => d.ev === 'O').length; // Items that passed (O)
    const overallRate = targetCount > 0 ? (resultCount / targetCount) * 100 : 0;
    const passRate = resultCount > 0 ? (passedItems / resultCount) * 100 : 0; // Pass rate among results

    const completeDepartments = kpiStatus.filter((s) => s.status === 'complete').length;
    const partialDepartments = kpiStatus.filter((s) => s.status === 'partial').length;
    const missingDepartments = kpiStatus.filter((s) => s.status === 'missing').length;

    return {
      targetCount,
      resultCount,
      passedItems,
      overallRate,
      passRate,
      completeDepartments,
      partialDepartments,
      missingDepartments,
    };
  }, [kpiDetails, kpiStatus]);

  // Department data
  const departmentData: DepartmentData[] = useMemo(() => {
    const deptMap = new Map<string, { target: number; result: number }>();
    kpiStatus.forEach((s) => {
      const existing = deptMap.get(s.department_name) || { target: 0, result: 0 };
      deptMap.set(s.department_name, {
        target: existing.target + s.total_metrics,
        result: existing.result + s.filled_metrics,
      });
    });
    return Array.from(deptMap.entries()).map(([name, data]) => ({
      name,
      target: data.target,
      result: data.result,
      rate: data.target > 0 ? (data.result / data.target) * 100 : 0,
    }));
  }, [kpiStatus]);

  // Filtered details
  const filteredDetails = useMemo(() => {
    return kpiDetails.filter((row) => {
      const deptMatch =
        !columnFilters.department || row.department_name === columnFilters.department;
      const measureMatch =
        !columnFilters.measurement || row.measurement === columnFilters.measurement;
      const unitMatch = !columnFilters.unit || (row.unit || 'Other') === columnFilters.unit;
      const judgeMatch = !columnFilters.judge || row.ev === columnFilters.judge;
      const accuJudge = (row.accu_result ?? 0) >= (row.accu_target ?? 0) ? 'O' : 'X';
      const accuJudgeMatch = !columnFilters.accu_judge || accuJudge === columnFilters.accu_judge;
      return deptMatch && measureMatch && unitMatch && judgeMatch && accuJudgeMatch;
    });
  }, [kpiDetails, columnFilters]);

  // Paginated details
  const totalPages = Math.ceil(filteredDetails.length / pageSize);
  const paginatedDetails = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDetails.slice(start, start + pageSize);
  }, [filteredDetails, currentPage, pageSize]);

  // Chart data
  const categoryChartData = useMemo(() => {
    const categoryMap = new Map<string, { target: number; result: number; passed: number }>();
    kpiDetails.forEach((d) => {
      const cat = d.category_name || 'Other';
      const existing = categoryMap.get(cat) || { target: 0, result: 0, passed: 0 };
      categoryMap.set(cat, {
        target: existing.target + (d.target ?? 0),
        result: existing.result + (d.result ?? 0),
        passed: existing.passed + (d.ev === 'O' ? 1 : 0),
      });
    });
    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      Target: data.target,
      Result: data.result,
      Passed: data.passed,
    }));
  }, [kpiDetails]);

  const statusPieData = [
    { name: 'Complete', value: summary.completeDepartments, color: '#16A34A' },
    { name: 'In Progress', value: summary.partialDepartments, color: '#EA580C' },
    { name: 'Not Started', value: summary.missingDepartments, color: '#DC2626' },
  ];

  const judgePieData =
    summary.resultCount > 0
      ? [
          { name: 'O (Pass)', value: summary.passedItems, color: '#16A34A' },
          {
            name: 'X (Fail)',
            value: Math.max(0, summary.resultCount - summary.passedItems),
            color: '#DC2626',
          },
        ]
      : [
          { name: 'O', value: 12, color: '#16A34A' },
          { name: 'X', value: 5, color: '#DC2626' },
        ];

  const radarData = useMemo(() => {
    const categoryMap = new Map<string, { target: number; result: number; count: number }>();
    kpiDetails.forEach((d) => {
      const cat = d.category_name || 'Other';
      const existing = categoryMap.get(cat) || { target: 0, result: 0, count: 0 };
      categoryMap.set(cat, {
        target: existing.target + (d.target ?? 0),
        result: existing.result + (d.result ?? 0),
        count: existing.count + 1,
      });
    });
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      target: data.count > 0 ? data.target / data.count : 0,
      result: data.count > 0 ? data.result / data.count : 0,
      fullMark: 100,
    }));
  }, [kpiDetails]);

  // Target breakdown by unit
  const targetByUnit = useMemo(() => {
    const unitMap = new Map<string, { count: number; targetSum: number; resultSum: number }>();
    kpiDetails.forEach((d) => {
      const unit = d.unit || 'Other';
      const existing = unitMap.get(unit) || { count: 0, targetSum: 0, resultSum: 0 };
      unitMap.set(unit, {
        count: existing.count + 1,
        targetSum: existing.targetSum + (d.target ?? 0),
        resultSum: existing.resultSum + (d.result ?? 0),
      });
    });

    // Get unit descriptions
    const getUnitDescription = (unit: string): string => {
      const descriptions: Record<string, string> = {
        person: 'Number of people',
        people: 'Number of people',
        'person/time': 'Person-times',
        times: 'Number of times',
        case: 'Number of cases',
        cases: 'Number of cases',
        project: 'Number of projects',
        projects: 'Number of projects',
        baht: 'Amount in Thai Baht',
        '%': 'Percentage value',
        percent: 'Percentage value',
        percentage: 'Percentage value',
        day: 'Number of days',
        days: 'Number of days',
        hour: 'Number of hours',
        hours: 'Number of hours',
        unit: 'Generic units',
        units: 'Generic units',
      };
      return descriptions[unit.toLowerCase()] || `${unit} based metrics`;
    };

    return Array.from(unitMap.entries())
      .map(([unit, data]) => ({
        unit,
        count: data.count,
        targetSum: data.targetSum,
        resultSum: data.resultSum,
        description: getUnitDescription(unit),
      }))
      .sort((a, b) => b.count - a.count);
  }, [kpiDetails]);

  // Filter actions
  const hasActiveFilters = Object.values(columnFilters).some((v) => v !== '');
  const clearFilters = () => {
    setColumnFilters({ department: '', measurement: '', unit: '', judge: '', accu_judge: '' });
    setCurrentPage(1);
  };

  return (
    <ShellLayout>
      <StandardPageLayout
        title="KPI Executive Dashboard"
        subtitle="Real-time KPI monitoring for management decisions"
        icon={Activity}
        iconColor="text-blue-600"
        fiscalYear={fiscalYear}
        availableYears={availableYears}
        onFiscalYearChange={(value) => setFiscalYear(value)}
        onRefresh={() => fetchKPIStatus()}
        loading={loading}
        theme="blue"
        rightActions={
          <>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[120px] h-8 bg-blue-50 border-blue-200 text-blue-700 text-xs font-medium">
                <CalendarDays className="w-3.5 h-3.5 mr-1" />
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

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px] h-8 bg-gray-50 text-xs border-gray-200">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.key}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }>
        <div className="space-y-6">
          {/* Tabs */}
          <Tabs defaultValue="detail" className="space-y-4">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="detail" className="data-[state=active]:bg-white">
                KPI Detail
              </TabsTrigger>
              <TabsTrigger value="charts" className="data-[state=active]:bg-white">
                Charts
              </TabsTrigger>
              <TabsTrigger value="department" className="data-[state=active]:bg-white">
                By Department
              </TabsTrigger>
              <TabsTrigger value="missing" className="data-[state=active]:bg-white">
                Missing Data
              </TabsTrigger>
            </TabsList>

            {/* KPI Detail Tab */}
            <TabsContent value="detail" className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium">KPI Performance Detail</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {filteredDetails.length} of {kpiDetails.length} items
                  </span>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-3 w-3 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              <KPIDetailTable
                loading={loading}
                kpiDetails={kpiDetails}
                filteredDetails={filteredDetails}
                paginatedDetails={paginatedDetails}
                columnFilters={columnFilters}
                setColumnFilters={setColumnFilters}
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                hasActiveFilters={hasActiveFilters}
                clearFilters={clearFilters}
              />
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="charts">
              <ChartsTab
                categoryChartData={categoryChartData}
                statusPieData={statusPieData}
                judgePieData={judgePieData}
                radarData={radarData}
                targetByUnit={targetByUnit}
              />
            </TabsContent>

            {/* Department Tab */}
            <TabsContent value="department">
              <DepartmentTab loading={loading} departmentData={departmentData} />
            </TabsContent>

            {/* Missing Tab */}
            <TabsContent value="missing">
              <MissingTab loading={loading} kpiDetails={kpiDetails} />
            </TabsContent>
          </Tabs>
        </div>
      </StandardPageLayout>
    </ShellLayout>
  );
}
