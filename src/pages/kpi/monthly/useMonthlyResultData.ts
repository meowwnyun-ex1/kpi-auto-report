import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { storage } from '@/shared/utils';
import { Category, YearlyTargetWithMonths, Stats, deriveCategoryValuesFromStats } from '../shared';

interface Attachment {
  url: string;
  caption: string;
  filename: string;
}

export interface MonthlyResultRow extends YearlyTargetWithMonths {
  months: Record<number, any>;
}

export function useMonthlyResultData(fiscalYear?: number, setFiscalYear?: (year: number) => void) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cat, setCat] = useState('');
  const [rows, setRows] = useState<MonthlyResultRow[]>([]);
  const [allRows, setAllRows] = useState<MonthlyResultRow[]>([]); // Store all rows for accurate counts
  const [depts, setDepts] = useState<{ dept_id: string }[]>([]);
  const [dept, setDept] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryTargetValues, setCategoryTargetValues] = useState<Record<string, number>>({});
  const [categoryTargetCounts, setCategoryTargetCounts] = useState<Record<string, number>>({});
  const [categoryResultCounts, setCategoryResultCounts] = useState<Record<string, number>>({});

  const canEdit = ['manager', 'admin', 'superadmin'].includes(user?.role ?? '');

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase();
    return rows.filter((row) => row.measurement?.toLowerCase().includes(query));
  }, [rows, searchQuery]);

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

  const loadAllRows = useCallback(async () => {
    try {
      const yearlyRes = await fetch(`/api/kpi-forms/yearly/${dept}/${fiscalYear}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const yearlyData = await yearlyRes.json();
      if (!yearlyData.success) return;

      const monthlyRes = await fetch(`/api/kpi-forms/monthly/${dept}/${fiscalYear}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const monthlyData = await monthlyRes.json();
      if (!monthlyData.success) return;

      const combinedData = yearlyData.data.map((yearly: any) => {
        const monthlyEntries = monthlyData.data.filter(
          (m: any) => m.yearly_target_id === yearly.id
        );
        const months: Record<number, any> = {};
        monthlyEntries.forEach((m: any) => {
          months[m.month] = {
            id: m.id,
            target: m.target,
            result: m.result,
            comment: m.comment,
            image_url: m.image_url,
            image_caption: m.image_caption,
          };
        });
        // For Monthly Results page, calculate usage from results, not targets
        const usedQuota = Object.values(months).reduce(
          (sum: number, month: any) => sum + (parseFloat(month.result) || 0),
          0
        );
        return {
          yearly_target_id: yearly.id,
          category_id: yearly.category_id,
          category_key: yearly.category_key,
          sub_category_id: yearly.sub_category_id,
          sub_category_name: yearly.sub_category_name,
          measurement: yearly.measurement,
          unit: yearly.unit,
          main: yearly.main,
          main_relate_display: yearly.main_relate_display,
          fy_target: yearly.fy_target,
          total_target: yearly.total_target,
          used_quota: usedQuota,
          remaining_quota: (yearly.total_target || 0) - usedQuota,
          months,
        };
      });
      setAllRows(combinedData);
    } catch {
      /* silent */
    }
  }, [dept, fiscalYear]);

  useEffect(() => {
    if (dept && fiscalYear) {
      loadStats();
      loadAllRows();
    }
  }, [dept, fiscalYear, loadAllRows]);

  useEffect(() => {
    if (cat && dept && fiscalYear) loadRows();
  }, [cat, dept, fiscalYear]);

  const calculateResultCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    allRows.forEach((row) => {
      // Use category_key from row if available, otherwise find by category_id
      const categoryKey = row.category_key;
      if (categoryKey) {
        // Check if any month has a result
        const hasResult = Object.values(row.months).some(
          (month) => month.result !== null && month.result !== undefined && month.result !== 0
        );
        if (hasResult) {
          counts[categoryKey] = (counts[categoryKey] || 0) + 1;
        }
      } else {
        // Fallback: find category by category_id
        const category = categories.find((cat) => cat.id === row.category_id);
        if (category) {
          const hasResult = Object.values(row.months).some(
            (month) => month.result !== null && month.result !== undefined && month.result !== 0
          );
          if (hasResult) {
            counts[category.key] = (counts[category.key] || 0) + 1;
          }
        }
      }
    });
    setCategoryResultCounts(counts);
  }, [allRows, categories]);

  useEffect(() => {
    calculateResultCounts();
  }, [allRows, calculateResultCounts]);
  useEffect(() => {
    if (dept && fiscalYear && categories.length > 0 && allRows.length > 0) {
      const { values, counts } = deriveCategoryValuesFromStats(stats);
      setCategoryTargetValues(values);

      // Calculate target counts from all rows data instead of stats
      const targetCounts: Record<string, number> = {};
      categories.forEach((cat) => {
        const categoryRows = allRows.filter((row) => row.category_key === cat.key);
        targetCounts[cat.key] = categoryRows.length;
      });
      setCategoryTargetCounts(targetCounts);
    }
  }, [dept, fiscalYear, categories, stats, allRows]);

  const loadCategories = async (retryCount = 0) => {
    try {
      const r = await fetch('/api/kpi-forms/categories');
      const d = await r.json();
      if (d.success) setCategories(d.data);
    } catch (error) {
      // Retry with exponential backoff for transient errors (max 3 retries)
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => loadCategories(retryCount + 1), delay);
      }
    }
  };

  const loadDepts = async (retryCount = 0) => {
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
    } catch (error) {
      // Retry with exponential backoff for transient errors (max 3 retries)
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => loadDepts(retryCount + 1), delay);
      }
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

  const loadRows = async () => {
    setLoading(true);
    try {
      const yearlyRes = await fetch(`/api/kpi-forms/yearly/${dept}/${fiscalYear}?category=${cat}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const yearlyData = await yearlyRes.json();
      if (!yearlyData.success) return;

      const monthlyRes = await fetch(
        `/api/kpi-forms/monthly/${dept}/${fiscalYear}?category=${cat}`,
        {
          headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
        }
      );
      const monthlyData = await monthlyRes.json();
      if (!monthlyData.success) return;

      const combinedData = yearlyData.data.map((yearly: any) => {
        const monthlyEntries = monthlyData.data.filter(
          (m: any) => m.yearly_target_id === yearly.id
        );
        const months: Record<number, any> = {};
        monthlyEntries.forEach((m: any) => {
          months[m.month] = {
            id: m.id,
            target: m.target,
            result: m.result,
            comment: m.comment,
            image_url: m.image_url,
            image_caption: m.image_caption,
            draft: (m.target ?? 0).toString(),
            draftResult: (m.result ?? 0).toString(),
            draftNote: m.comment ?? '',
            draftAttachment: m.image_url ? { url: m.image_url, caption: m.image_caption } : null,
            dirty: false,
            dirtyResult: false,
            saving: false,
          };
        });
        const usedQuota = Object.values(months).reduce(
          (sum: number, month: any) => sum + (parseFloat(month.target) || 0),
          0
        );
        return {
          yearly_target_id: yearly.id,
          category_id: yearly.category_id,
          category_key: yearly.category_key, // Add category_key for proper counting
          sub_category_id: yearly.sub_category_id,
          sub_category_name: yearly.sub_category_name,
          measurement: yearly.measurement,
          unit: yearly.unit,
          main: yearly.main,
          main_relate_display: yearly.main_relate_display,
          fy_target: yearly.fy_target,
          total_target: yearly.total_target,
          used_quota: usedQuota,
          remaining_quota: (yearly.total_target || 0) - usedQuota,
          months,
        };
      });
      setRows(combinedData);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const onChangeResult = (yearlyTargetId: number, month: number, value: string) => {
    setRows((p) =>
      p.map((r) => {
        if (r.yearly_target_id === yearlyTargetId && r.months[month]) {
          return {
            ...r,
            months: {
              ...r.months,
              [month]: { ...r.months[month], draftResult: value, dirtyResult: true },
            },
          };
        }
        return r;
      })
    );
  };

  const onNoteChange = (yearlyTargetId: number, month: number, value: string) => {
    setRows((p) =>
      p.map((r) => {
        if (r.yearly_target_id === yearlyTargetId && r.months[month]) {
          return {
            ...r,
            months: { ...r.months, [month]: { ...r.months[month], draftNote: value, dirty: true } },
          };
        }
        return r;
      })
    );
  };

  const onAttachmentChange = (
    yearlyTargetId: number,
    month: number,
    attachment: Attachment | null
  ) => {
    setRows((p) =>
      p.map((r) => {
        if (r.yearly_target_id === yearlyTargetId && r.months[month]) {
          return {
            ...r,
            months: {
              ...r.months,
              [month]: { ...r.months[month], draftAttachment: attachment, dirty: true },
            },
          };
        }
        return r;
      })
    );
  };

  const saveMonthResult = async (
    yearlyTargetId: number,
    month: number,
    monthData: any,
    toast: any
  ) => {
    try {
      setRows((p) =>
        p.map((r) => {
          if (r.yearly_target_id === yearlyTargetId && r.months[month]) {
            return { ...r, months: { ...r.months, [month]: { ...r.months[month], saving: true } } };
          }
          return r;
        })
      );

      const saveResult = monthData.dirtyResult && monthData.id;

      if (saveResult) {
        const resultResponse = await fetch(`/api/kpi-forms/monthly/${monthData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storage.getAuthToken()}`,
          },
          body: JSON.stringify({
            result: parseFloat(monthData.draftResult) || 0,
            comment: monthData.draftNote || null,
            image_url: monthData.draftAttachment?.url || null,
            image_caption: monthData.draftAttachment?.caption || null,
          }),
        });
        const resultData = await resultResponse.json();
        if (!resultData.success) throw new Error(resultData.message);
      }

      toast({ title: 'Saved', description: 'Result updated successfully' });

      // Update local state immediately for real-time feedback
      setRows((p) =>
        p.map((r) => {
          if (r.yearly_target_id === yearlyTargetId) {
            const updatedMonths = {
              ...r.months,
              [month]: {
                ...r.months[month],
                saving: false,
                dirtyResult: false,
                result: saveResult
                  ? parseFloat(monthData.draftResult) || 0
                  : r.months[month].result,
                draftResult: saveResult
                  ? (parseFloat(monthData.draftResult) || 0).toString()
                  : r.months[month].draftResult,
              },
            };
            const newUsedQuota = Object.values(updatedMonths).reduce(
              (sum: number, m: any) => sum + (parseFloat(String(m.target)) || 0),
              0
            );
            return {
              ...r,
              used_quota: newUsedQuota,
              remaining_quota: (r.total_target || 0) - newUsedQuota,
              months: updatedMonths,
            };
          }
          return r;
        })
      );

      // Refresh data from server for consistency
      loadStats();
      loadAllRows(); // Update all rows for accurate counts
      if (cat) {
        loadRows(); // Reload filtered rows for current category
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to save result',
        variant: 'destructive',
      });
      setRows((p) =>
        p.map((r) => {
          if (r.yearly_target_id === yearlyTargetId && r.months[month]) {
            return {
              ...r,
              months: { ...r.months, [month]: { ...r.months[month], saving: false } },
            };
          }
          return r;
        })
      );
    }
  };

  const refreshData = useCallback(() => {
    loadStats();
    loadAllRows(); // Refresh all rows for accurate counts
    if (cat) loadRows();
  }, [loadStats, loadAllRows, cat]);

  return {
    user,
    categories,
    cat,
    setCat,
    rows,
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
    filteredRows,
    onChangeResult,
    saveMonthResult,
    refreshData,
  };
}
