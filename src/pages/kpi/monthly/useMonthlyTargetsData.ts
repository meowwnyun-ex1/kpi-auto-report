import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYearSelector } from '@/shared/hooks/useFiscalYearSelector';
import { storage } from '@/shared/utils';
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
  const [depts, setDepts] = useState<{ dept_id: string }[]>([]);
  const [dept, setDept] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<'all' | number>('all');
  const [categoryTargetValues, setCategoryTargetValues] = useState<Record<string, number>>({});
  const [categoryTargetCounts, setCategoryTargetCounts] = useState<Record<string, number>>({});
  const [categoryActualCounts, setCategoryActualCounts] = useState<Record<string, number>>({});

  const canEdit = ['manager', 'admin', 'superadmin'].includes(user?.role ?? '');

  const filteredYearlyTargets = useMemo(() => {
    if (!searchQuery.trim()) return yearlyTargets;
    const query = searchQuery.toLowerCase();
    return yearlyTargets.filter((target) => target.measurement?.toLowerCase().includes(query));
  }, [yearlyTargets, searchQuery]);

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

  const calculateActualCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    yearlyTargets.forEach((target) => {
      // Find the category for this target
      const category = categories.find((cat) => cat.id === target.category_id);
      if (category) {
        // Check if any month has a target value
        const hasTarget = monthlyTargets.some(
          (mt) =>
            mt.yearly_target_id === target.id &&
            mt.target !== null &&
            mt.target !== undefined &&
            mt.target !== 0
        );
        if (hasTarget) {
          counts[category.key] = (counts[category.key] || 0) + 1;
        }
      }
    });
    setCategoryActualCounts(counts);
  }, [yearlyTargets, monthlyTargets, categories]);

  useEffect(() => {
    if (dept && fiscalYear) loadStats();
  }, [dept, fiscalYear]);

  useEffect(() => {
    if (cat && dept && fiscalYear) {
      loadMonthlyTargets().then(() => loadYearlyTargets());
    }
  }, [cat, dept, fiscalYear]);
  useEffect(() => {
    calculateActualCounts();
  }, [yearlyTargets, monthlyTargets, calculateActualCounts]);

  useEffect(() => {
    if (dept && fiscalYear && categories.length > 0) {
      const { values, counts } = deriveCategoryValuesFromStats(stats);
      setCategoryTargetValues(values);
      setCategoryTargetCounts(counts);
    }
  }, [dept, fiscalYear, categories, stats]);

  const loadCategories = async () => {
    try {
      const r = await fetch('/api/kpi-forms/categories');
      const d = await r.json();
      if (d.success) setCategories(d.data);
    } catch {
      /* silent */
    }
  };

  const loadDepts = async () => {
    try {
      const r = await fetch('/api/departments');
      const d = await r.json();
      if (d.success) {
        const filteredDepts =
          user?.role === 'manager'
            ? d.data.filter((dp: any) => dp.dept_id === user?.department_id)
            : d.data;
        setDepts(filteredDepts);
      }
    } catch {
      /* silent */
    }
  };

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await fetch(`/api/kpi-forms/stats/${dept}/${fiscalYear}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const d = await r.json();
      if (d.success) setStats(d.data ?? {});
    } catch {
      /* silent */
    } finally {
      setStatsLoading(false);
    }
  }, [dept, fiscalYear]);

  const loadYearlyTargets = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/kpi-forms/yearly/${dept}/${fiscalYear}?category=${cat}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const d = await r.json();
      if (d.success) {
        const targets = d.data.map((target: YearlyTarget) => {
          const monthlyUsed = monthlyTargets
            .filter((mt) => mt.yearly_target_id === target.id)
            .reduce((sum, mt) => sum + (mt.target || 0), 0);
          return {
            ...target,
            used_quota: monthlyUsed,
            remaining_quota: (target.total_target || 0) - monthlyUsed,
          };
        });
        setYearlyTargets(targets);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyTargets = async () => {
    try {
      const r = await fetch(`/api/kpi-forms/monthly/${dept}/${fiscalYear}?category=${cat}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const d = await r.json();
      if (d.success) setMonthlyTargets(d.data);
    } catch {
      /* silent */
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
      loadMonthlyTargets().then(() => loadYearlyTargets());
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
      // Only fill months that don't already have a target set
      const entries = [];
      const FY_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
      for (const month of FY_MONTHS) {
        const existing = monthlyTargets.find(
          (mt) => mt.yearly_target_id === yearlyTargetId && mt.month === month && mt.target
        );
        if (!existing) {
          entries.push({
            yearly_target_id: yearlyTargetId,
            department_id: dept,
            category_id: yearlyTarget?.category_id ?? null,
            fiscal_year: fiscalYear,
            month,
            target,
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
          description: `Target set to ${target.toLocaleString()} for all months`,
        });
      }
      loadStats();
      loadMonthlyTargets().then(() => loadYearlyTargets());
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

  const refreshData = () => {
    loadStats();
    if (cat) {
      loadMonthlyTargets().then(() => loadYearlyTargets());
    }
  };

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
    categoryActualCounts,
    canEdit,
    filteredYearlyTargets,
    saveMonthlyTarget,
    getMonthlyTarget,
    getTargetStatus,
    refreshData,
    fillAllMonths,
  };
}
