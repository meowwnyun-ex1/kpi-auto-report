import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYearSelector } from '@/contexts/FiscalYearContext';
import { ApiService } from '@/services/api-service';
import { KPI_CATEGORIES, MONTHS, type SortField, type SortDirection } from '../constants';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export function useDashboardData(initialCategory?: string) {
  const { user } = useAuth();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();
  const { lastEvent } = useRealtimeSync({ fiscalYear });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const m = new Date().getMonth() + 1;
    return m >= 4 ? m : m === 1 ? 4 : m + 3;
  });
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [kpiStatus, setKpiStatus] = useState<any[]>([]);
  const [kpiDetails, setKpiDetails] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<any[]>([]);

  // Table states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('department');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Load departments & categories
  useEffect(() => {
    const load = async () => {
      try {
        const d = await ApiService.get<any>('/departments');
        if (d.success) setDepartments(d.data);
      } catch {
        /* silent */
      }
      try {
        const d = await ApiService.get<any>('/kpi-forms/categories');
        setCategories(d.data || []);
      } catch {
        /* silent */
      }
    };
    load();
  }, []);

  // Load overview data from real DB
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const overviewData = await ApiService.get<any>(
          `/kpi-forms/overview/${fiscalYear}/${selectedMonth}`,
          { category: selectedCategory === 'all' ? '' : selectedCategory }
        );
        if (overviewData.success) {
          setKpiStatus(overviewData.data?.status || []);
          setKpiDetails(overviewData.data?.details || []);
        }

        const yearlyData = await ApiService.get<any>(
          `/kpi-forms/yearly/${selectedDept === 'all' ? 'all' : selectedDept}/${fiscalYear}`
        );
        if (yearlyData.success) setKpiData(yearlyData.data || []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fiscalYear, selectedMonth, selectedDept, selectedCategory]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedCategory]);

  // Summary calculations
  const summary = useMemo(() => {
    const targetCount = kpiDetails.length;
    const resultCount = kpiDetails.filter(
      (d: any) => d.result !== null && d.result !== undefined
    ).length;
    const passedItems = kpiDetails.filter((d: any) => d.status === 'achieved').length;
    const overallRate = targetCount > 0 ? (resultCount / targetCount) * 100 : 0;
    const passRate = resultCount > 0 ? (passedItems / resultCount) * 100 : 0;
    const completeDepts = kpiStatus.filter((s: any) => s.status === 'complete').length;
    const partialDepts = kpiStatus.filter((s: any) => s.status === 'partial').length;
    const missingDepts = kpiStatus.filter((s: any) => s.status === 'missing').length;
    return {
      targetCount,
      resultCount,
      passedItems,
      overallRate,
      passRate,
      completeDepts,
      partialDepts,
      missingDepts,
    };
  }, [kpiDetails, kpiStatus]);

  // Department data
  const departmentData = useMemo(() => {
    const deptMap = new Map<string, { target: number; result: number }>();
    kpiStatus.forEach((s: any) => {
      const existing = deptMap.get(s.department_name) || { target: 0, result: 0 };
      deptMap.set(s.department_name, {
        target: existing.target + s.total_measurements,
        result: existing.result + s.filled_measurements,
      });
    });
    return Array.from(deptMap.entries()).map(([name, data]) => ({
      name,
      target: data.target,
      result: data.result,
      rate: data.target > 0 ? (data.result / data.target) * 100 : 0,
    }));
  }, [kpiStatus]);

  // Unique departments for filter
  const detailDepartments = useMemo(() => {
    const depts = new Set(kpiDetails.map((d: any) => d.department_name).filter(Boolean));
    return Array.from(depts).sort();
  }, [kpiDetails]);

  // Filter and sort details
  const filteredAndSortedDetails = useMemo(() => {
    let filtered = kpiDetails.filter((row: any) => {
      const searchMatch =
        !searchQuery.trim() ||
        row.department_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.measurement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.unit?.toLowerCase().includes(searchQuery.toLowerCase());
      const deptMatch = selectedDept === 'all' || row.department_name === selectedDept;
      const catMatch = selectedCategory === 'all' || row.category_key === selectedCategory;
      return searchMatch && deptMatch && catMatch;
    });
    filtered.sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'department':
          aVal = a.department_name || '';
          bVal = b.department_name || '';
          break;
        case 'measurement':
          aVal = a.measurement || '';
          bVal = b.measurement || '';
          break;
        case 'target':
          aVal = a.target ?? 0;
          bVal = b.target ?? 0;
          break;
        case 'result':
          aVal = a.result ?? 0;
          bVal = b.result ?? 0;
          break;
        case 'rate':
          aVal = a.target > 0 ? (a.result ?? 0) / a.target : 0;
          bVal = b.target > 0 ? (b.result ?? 0) / b.target : 0;
          break;
        case 'status':
          aVal = a.result != null ? (a.status === 'achieved' ? 1 : 0) : -1;
          bVal = b.result != null ? (b.status === 'achieved' ? 1 : 0) : -1;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [kpiDetails, searchQuery, selectedDept, selectedCategory, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedDetails.length / itemsPerPage);
  const paginatedDetails = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedDetails.slice(start, start + itemsPerPage);
  }, [filteredAndSortedDetails, currentPage, itemsPerPage]);

  // Category chart data
  const categoryChartData = useMemo(() => {
    const catMap = new Map<string, { target: number; result: number; passed: number }>();
    kpiDetails.forEach((d: any) => {
      const cat = d.category_name || 'Other';
      const existing = catMap.get(cat) || { target: 0, result: 0, passed: 0 };
      catMap.set(cat, {
        target: existing.target + (d.target ?? 0),
        result: existing.result + (d.result ?? 0),
        passed: existing.passed + (d.status === 'achieved' ? 1 : 0),
      });
    });
    return Array.from(catMap.entries())
      .map(([name, data]) => ({
        name,
        target: data.target,
        result: data.result,
        passed: data.passed,
        completionRate: data.target > 0 ? (data.result / data.target) * 100 : 0,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);
  }, [kpiDetails]);

  // Calculate total targets across all categories for percentage calculation
  const calculateTotalTargets = () => {
    return KPI_CATEGORIES.reduce((total, category) => {
      const catData = kpiData.filter((item: any) => {
        const cat = categories.find((c: any) => c.key === category.id);
        return cat && item.category_id === cat.id;
      });
      const target = catData.reduce((sum: number, item: any) => sum + (item.total_target || 0), 0);
      return total + target;
    }, 0);
  };

  // Calculate category statistics
  const calculateCategoryStats = (categoryId: number) => {
    const catData = kpiData.filter((item: any) => item.category_id === categoryId);
    // Count by number of items, not values
    const targetCount = catData.length; // Total items in this category
    const resultCount = catData.filter((item: any) => (item.accu_result || 0) > 0).length; // Items with results
    // Keep total values for reference
    const targetValue = catData.reduce(
      (sum: number, item: any) => sum + (item.total_target || 0),
      0
    );
    const resultValue = catData.reduce(
      (sum: number, item: any) => sum + (item.accu_result || 0),
      0
    );
    return {
      target: targetCount,
      result: resultCount,
      count: catData.length,
      resultCount,
      targetValue,
      resultValue,
    };
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const refreshData = () => {
    setLoading(true);
    ApiService.get<any>(`/kpi-forms/overview/${fiscalYear}/${selectedMonth}`, {
      category: selectedCategory === 'all' ? '' : selectedCategory,
    })
      .then((d) => {
        if (d.success) {
          setKpiStatus(d.data?.status || []);
          setKpiDetails(d.data?.details || []);
        }
      })
      .finally(() => setLoading(false));
  };

  // Realtime: refresh on any write event
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === 'api_change') {
      refreshData();
    }
  }, [lastEvent]);

  return {
    user,
    fiscalYear,
    setFiscalYear,
    availableYears,
    selectedMonth,
    setSelectedMonth,
    selectedDept,
    setSelectedDept,
    selectedCategory,
    setSelectedCategory,
    departments,
    categories,
    loading,
    kpiStatus,
    kpiDetails,
    kpiData,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    sortField,
    sortDirection,
    handleSort,
    summary,
    departmentData,
    detailDepartments,
    filteredAndSortedDetails,
    totalPages,
    paginatedDetails,
    categoryChartData,
    calculateTotalTargets,
    calculateCategoryStats,
    refreshData,
  };
}
