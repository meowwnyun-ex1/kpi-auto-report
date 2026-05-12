import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYearSelector } from '@/contexts/FiscalYearContext';
import { storage } from '@/shared/utils';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import {
  Category,
  YearlyTarget,
  MonthlyTarget,
  Stats,
  deriveCategoryValuesFromStats,
} from '../shared';

export function useMonthlyTargetsData() {
  const { user } = useAuth();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cat, setCat] = useState('');
  const [yearlyTargets, setYearlyTargets] = useState<YearlyTarget[]>([]);
  const [monthlyTargets, setMonthlyTargets] = useState<MonthlyTarget[]>([]);
  const [allYearlyTargets, setAllYearlyTargets] = useState<YearlyTarget[]>([]);
  const [allMonthlyTargets, setAllMonthlyTargets] = useState<MonthlyTarget[]>([]);
  const [depts, setDepts] = useState<{ dept_id: string }[]>([]);
  const [dept, setDept] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<'all' | number>('all');
  const [categoryTargetValues, setCategoryTargetValues] = useState<Record<string, number>>({});
  const [categoryTargetCounts, setCategoryTargetCounts] = useState<Record<string, number>>({});
  const [categoryResultCounts, setCategoryResultCounts] = useState<Record<string, number>>({});

  const { lastEvent } = useRealtimeSync({
    fiscalYear,
    dept,
    category: cat || undefined,
  });

  const canEdit = ['manager', 'admin', 'superadmin'].includes(user?.role ?? '');

  const filteredYearlyTargets = useMemo(() => {
    let result = yearlyTargets;

    if (!searchQuery.trim()) {
      // Sort by hierarchy: category > subcategory > measurement
      result = [...result].sort((a, b) => {
        // First by category sort_order
        const catA = categories.find((c) => c.id === a.category_id);
        const catB = categories.find((c) => c.id === b.category_id);
        const catSortA = catA?.sort_order ?? 999;
        const catSortB = catB?.sort_order ?? 999;

        if (catSortA !== catSortB) return catSortA - catSortB;

        // Then by subcategory sort_order
        const subSortA = a.sub_category_sort_order ?? 999;
        const subSortB = b.sub_category_sort_order ?? 999;

        if (subSortA !== subSortB) return subSortA - subSortB;

        // Finally by id
        const idA = a.id ?? 0;
        const idB = b.id ?? 0;
        return idA - idB;
      });
    } else {
      const query = searchQuery.toLowerCase();
      result = yearlyTargets.filter(
        (target) =>
          target.measurement?.toLowerCase().includes(query) ||
          target.category_name?.toLowerCase().includes(query) ||
          target.sub_category_name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [yearlyTargets, searchQuery, categories]);

  useEffect(() => {
    loadCategories();
    loadDepts();
  }, []);

  useEffect(() => {
    if (depts.length && !dept) {
      const ud = depts.find((d) => d.dept_id === user?.department_id);
      setDept(ud?.dept_id ?? depts[0].dept_id);
    }
  }, [depts]);

  const calculateResultCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    allYearlyTargets.forEach((target) => {
      // Use category_key from target if available, otherwise find by category_id
      const categoryKey = target.category_key;
      if (categoryKey) {
        // Check if any month has a target value
        const hasTarget = allMonthlyTargets.some(
          (mt) =>
            mt.yearly_target_id === target.id &&
            mt.target !== null &&
            mt.target !== undefined &&
            mt.target !== 0
        );
        if (hasTarget) {
          counts[categoryKey] = (counts[categoryKey] || 0) + 1;
        }
      }
    });
    setCategoryResultCounts(counts);
  }, [allYearlyTargets, allMonthlyTargets, categories]);

  const loadAllTargets = useCallback(async () => {
    if (!dept || !fiscalYear) return;
    try {
      // Load all yearly targets (without category filter)
      const yearlyRes = await fetch(`/api/kpi-forms/yearly/${dept}/${fiscalYear}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const yearlyData = await yearlyRes.json();
      if (yearlyData.success && Array.isArray(yearlyData.data)) {
        setAllYearlyTargets(yearlyData.data);
      } else {
        setAllYearlyTargets([]);
      }

      // Load all monthly targets (without category filter)
      const monthlyRes = await fetch(`/api/kpi-forms/monthly/${dept}/${fiscalYear}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const monthlyData = await monthlyRes.json();
      if (monthlyData.success && Array.isArray(monthlyData.data)) {
        setAllMonthlyTargets(monthlyData.data);
      } else {
        setAllMonthlyTargets([]);
      }
    } catch (err) {
      console.error('Failed to load all targets:', err);
      setAllYearlyTargets([]);
      setAllMonthlyTargets([]);
    }
  }, [dept, fiscalYear]);

  useEffect(() => {
    if (dept && fiscalYear) {
      loadStats();
      loadAllTargets(); // Load all targets for accurate counts
    }
  }, [dept, fiscalYear, loadAllTargets]);

  useEffect(() => {
    if (cat && dept && fiscalYear) {
      // Load filtered data for the selected category
      loadMonthlyTargets().then(() => loadYearlyTargets());
    }
  }, [cat, dept, fiscalYear]);
  useEffect(() => {
    calculateResultCounts();
  }, [allYearlyTargets, allMonthlyTargets, calculateResultCounts]);

  useEffect(() => {
    if (dept && fiscalYear && categories.length > 0 && allYearlyTargets.length > 0) {
      const { values, counts } = deriveCategoryValuesFromStats(stats);
      setCategoryTargetValues(values);

      // Calculate target counts from all yearly targets data instead of stats
      const targetCounts: Record<string, number> = {};
      categories.forEach((cat) => {
        const categoryRows = allYearlyTargets.filter((row) => row.category_key === cat.key);
        targetCounts[cat.key] = categoryRows.length;
      });
      setCategoryTargetCounts(targetCounts);
    }
  }, [dept, fiscalYear, categories, stats, allYearlyTargets]);

  const loadCategories = async (retryCount = 0) => {
    try {
      const r = await fetch('/api/kpi-forms/categories');
      const d = await r.json();
      if (d.success && Array.isArray(d.data)) {
        setCategories(d.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => loadCategories(retryCount + 1), delay);
      } else {
        setCategories([]);
      }
    }
  };

  const loadDepts = async (retryCount = 0) => {
    try {
      const r = await fetch('/api/departments');
      const d = await r.json();
      if (d.success && Array.isArray(d.data)) {
        const filteredDepts =
          user?.role === 'manager'
            ? d.data.filter((dp: any) => dp.dept_id === user?.department_id)
            : d.data;
        setDepts(filteredDepts);
      } else {
        setDepts([]);
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => loadDepts(retryCount + 1), delay);
      }
    }
  };

  const loadStats = useCallback(async () => {
    if (!dept || !fiscalYear) return;
    setStatsLoading(true);
    try {
      const r = await fetch(`/api/kpi-forms/stats/${dept}/${fiscalYear}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const d = await r.json();
      if (d.success) setStats(d.data ?? {});
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [dept, fiscalYear]);

  const loadYearlyTargets = async () => {
    if (!dept || !fiscalYear || !cat) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/kpi-forms/yearly/${dept}/${fiscalYear}?category=${cat}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const d = await r.json();
      if (d.success && Array.isArray(d.data)) {
        setYearlyTargets(d.data);
      } else {
        setYearlyTargets([]);
      }
    } catch (err) {
      console.error('Failed to load yearly targets:', err);
      setYearlyTargets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyTargets = async () => {
    if (!dept || !fiscalYear || !cat) return;
    try {
      const r = await fetch(`/api/kpi-forms/monthly/${dept}/${fiscalYear}?category=${cat}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const d = await r.json();
      if (d.success && Array.isArray(d.data)) {
        setMonthlyTargets(d.data);
      } else {
        setMonthlyTargets([]);
      }
    } catch (err) {
      console.error('Failed to load monthly targets:', err);
      setMonthlyTargets([]);
    }
  };

  const saveMonthlyTarget = async (
    yearlyTargetId: number,
    month: number,
    target: number,
    comment?: string,
    toast?: any
  ) => {
    try {
      const res = await fetch(`/api/kpi-forms/monthly/${yearlyTargetId}/${month}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify({ target, comment: comment || null }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.message);

      if (toast) {
        toast({ title: 'Target Saved', description: `Target set to ${target.toLocaleString()}` });
      }
      // Refresh data immediately for real-time updates
      loadStats();
      loadAllTargets(); // Update all targets for accurate counts
      if (cat) {
        loadMonthlyTargets().then(() => loadYearlyTargets());
      }
    } catch (e: any) {
      if (toast) {
        toast({
          title: 'Save Failed',
          description: e.message || 'Failed to save',
          variant: 'destructive',
        });
      }
    }
  };

  const getMonthlyTarget = (yearlyTargetId: number, month: number) => {
    return monthlyTargets.find(
      (mt) => mt.yearly_target_id === yearlyTargetId && mt.month === month
    );
  };

  const fillAllMonths = async (yearlyTargetId: number, target: number, toast?: any) => {
    try {
      const yearlyTarget = yearlyTargets.find((yt) => yt.id === yearlyTargetId);

      // Fill ALL months with equal distribution using remaining_quota
      const entries = [];
      const FY_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

      // Get remaining_quota to distribute
      const remainingQuota = yearlyTarget?.remaining_quota || 0;
      const totalTarget = yearlyTarget?.total_quota || target;

      // Find months that don't have targets yet
      const monthsWithoutTargets = FY_MONTHS.filter((month) => {
        const existing = monthlyTargets.find(
          (mt) => mt.yearly_target_id === yearlyTargetId && mt.month === month
        );
        return !existing || existing.target === null || existing.target === 0;
      });

      if (monthsWithoutTargets.length === 0) {
        if (toast) {
          toast({
            title: 'Cannot Fill',
            description: 'All months already have targets',
            variant: 'destructive',
          });
        }
        return;
      }

      // Distribute remaining_quota equally across months without targets
      const baseTarget = Math.floor(remainingQuota / monthsWithoutTargets.length);
      const remainder = remainingQuota % monthsWithoutTargets.length;

      for (let i = 0; i < monthsWithoutTargets.length; i++) {
        const month = monthsWithoutTargets[i];
        // Add remainder to first few months to ensure total equals remaining_quota
        const monthTarget = i < remainder ? baseTarget + 1 : baseTarget;

        // Check if entry already exists
        const existing = monthlyTargets.find(
          (mt) => mt.yearly_target_id === yearlyTargetId && mt.month === month
        );

        if (existing) {
          // Include id for UPDATE
          entries.push({
            id: existing.id,
            yearly_target_id: yearlyTargetId,
            department_id: dept,
            category_id: yearlyTarget?.category_id ?? null,
            fiscal_year: fiscalYear,
            month,
            target: monthTarget,
            comment: null,
          });
        } else {
          // No id for INSERT
          entries.push({
            yearly_target_id: yearlyTargetId,
            department_id: dept,
            category_id: yearlyTarget?.category_id ?? null,
            fiscal_year: fiscalYear,
            month,
            target: monthTarget,
            comment: null,
          });
        }
      }

      const res = await fetch(`/api/kpi-forms/monthly/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify({ entries }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.message);

      if (toast) {
        toast({
          title: 'All Months Filled',
          description: `Remaining quota (${remainingQuota.toLocaleString()}) distributed to ${monthsWithoutTargets.length} months`,
        });
      }
      loadStats();
      loadAllTargets(); // Update all targets for accurate counts
      if (cat) {
        loadMonthlyTargets().then(() => loadYearlyTargets());
      }
    } catch (e: any) {
      if (toast) {
        toast({
          title: 'Fill Failed',
          description: e.message || 'Failed to fill all months',
          variant: 'destructive',
        });
      }
    }
  };

  const getTargetStatus = (yearlyTargetId: number, month: number) => {
    const mt = getMonthlyTarget(yearlyTargetId, month);
    const hasResult = mt && mt.result !== null;

    if (hasResult) {
      return {
        status: 'complete',
        color: 'emerald',
        text: 'Result',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        borderColor: 'border-emerald-200',
        icon: 'CheckCircle',
      };
    }

    if (mt && mt.target !== null) {
      return {
        status: 'target_set',
        color: 'blue',
        text: 'Target',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        icon: 'Target',
      };
    }

    return {
      status: 'not_set',
      color: 'gray',
      text: 'Not Set',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-400',
      borderColor: 'border-gray-200',
      icon: 'Circle',
    };
  };

  const refreshData = useCallback(() => {
    loadStats();
    loadAllTargets(); // Refresh all targets for accurate counts
    if (cat) {
      loadMonthlyTargets().then(() => loadYearlyTargets());
    }
  }, [loadStats, loadAllTargets, cat]);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === 'api_change') {
      refreshData();
    }
  }, [lastEvent, refreshData]);

  return {
    user,
    fiscalYear,
    setFiscalYear,
    availableYears,
    categories,
    cat,
    setCat,
    yearlyTargets,
    monthlyTargets,
    depts,
    dept,
    setDept,
    loading,
    stats,
    statsLoading,
    searchQuery,
    setSearchQuery,
    categoryTargetValues,
    categoryTargetCounts,
    categoryResultCounts,
    canEdit,
    filteredYearlyTargets,
    saveMonthlyTarget,
    getMonthlyTarget,
    getTargetStatus,
    refreshData,
    fillAllMonths,
  };
}
