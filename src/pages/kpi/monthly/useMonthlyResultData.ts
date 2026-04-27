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
  const [depts, setDepts] = useState<{ dept_id: string }[]>([]);
  const [dept, setDept] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryTargetValues, setCategoryTargetValues] = useState<Record<string, number>>({});
  const [categoryTargetCounts, setCategoryTargetCounts] = useState<Record<string, number>>({});
  const [categoryActualCounts, setCategoryActualCounts] = useState<Record<string, number>>({});

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

  useEffect(() => {
    if (dept && fiscalYear) loadStats();
  }, [dept, fiscalYear]);
  useEffect(() => {
    if (cat && dept && fiscalYear) loadRows();
  }, [cat, dept, fiscalYear]);

  const calculateActualCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    rows.forEach((row) => {
      // Find the category for this row
      const category = categories.find((cat) => cat.id === row.category_id);
      if (category) {
        // Check if any month has a result
        const hasResult = Object.values(row.months).some(
          (month) => month.result !== null && month.result !== undefined && month.result !== 0
        );
        if (hasResult) {
          counts[category.key] = (counts[category.key] || 0) + 1;
        }
      }
    });
    setCategoryActualCounts(counts);
  }, [rows, categories]);

  useEffect(() => {
    calculateActualCounts();
  }, [rows, calculateActualCounts]);
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
      loadRows(); // Reload rows to get latest data
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

  const refreshData = () => {
    loadStats();
    if (cat) loadRows();
  };

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
    categoryActualCounts,
    canEdit,
    filteredRows,
    onChangeResult,
    saveMonthResult,
    refreshData,
  };
}
