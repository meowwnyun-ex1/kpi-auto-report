import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { storage } from '@/shared/utils';
import { Category, YearlyTargetWithMonths, Stats, useCalculateTotalTargetValues } from '../shared';

interface Attachment {
  url: string;
  caption: string;
  filename: string;
}

export interface MonthlyResultRow extends YearlyTargetWithMonths {
  months: Record<number, any>;
}

export function useMonthlyResultData() {
  const { user } = useAuth();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYear();

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

  const canEdit = ['manager', 'admin', 'superadmin'].includes(user?.role ?? '');
  const calculateTotalTargetValues = useCalculateTotalTargetValues(categories);

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
  useEffect(() => {
    if (dept && fiscalYear && categories.length > 0) {
      calculateTotalTargetValues(String(dept), String(fiscalYear)).then(({ values, counts }) => {
        setCategoryTargetValues(values);
        setCategoryTargetCounts(counts);
      });
    }
  }, [dept, fiscalYear, categories, calculateTotalTargetValues]);

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
            note: m.note,
            image_url: m.image_url,
            image_caption: m.image_caption,
            draft: (m.target ?? 0).toString(),
            draftResult: (m.result ?? 0).toString(),
            draftNote: m.note ?? '',
            draftAttachment: m.image_url ? { url: m.image_url, caption: m.image_caption } : null,
            dirty: false,
            dirtyResult: false,
            saving: false,
          };
        });
        const usedQuota = Object.values(months).reduce(
          (sum: number, month: any) => sum + (parseFloat(month.result) || 0),
          0
        );
        return {
          yearly_target_id: yearly.id,
          measurement: yearly.measurement,
          unit: yearly.unit,
          main: yearly.main,
          main_relate_display: yearly.main_relate_display,
          fy_target: yearly.fy_target,
          total_quota: yearly.total_quota,
          used_quota: usedQuota,
          remaining_quota: (yearly.total_quota || 0) - usedQuota,
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

  const onChange = (yearlyTargetId: number, month: number, value: string) => {
    setRows((p) =>
      p.map((r) => {
        if (r.yearly_target_id === yearlyTargetId && r.months[month]) {
          return {
            ...r,
            months: { ...r.months, [month]: { ...r.months[month], draft: value, dirty: true } },
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

      const saveTarget = monthData.dirty && monthData.id;
      const saveResult = monthData.dirtyResult && monthData.id;

      if (saveTarget) {
        const targetResponse = await fetch(`/api/kpi-forms/monthly/${monthData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storage.getAuthToken()}`,
          },
          body: JSON.stringify({ target: parseFloat(monthData.draft) || 0 }),
        });
        const targetData = await targetResponse.json();
        if (!targetData.success) throw new Error(targetData.message);
      }

      if (saveResult) {
        const resultResponse = await fetch(`/api/kpi-forms/monthly/${monthData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storage.getAuthToken()}`,
          },
          body: JSON.stringify({
            result: parseFloat(monthData.draftResult) || 0,
            note: monthData.draftNote || null,
            image_url: monthData.draftAttachment?.url || null,
            image_caption: monthData.draftAttachment?.caption || null,
          }),
        });
        const resultData = await resultResponse.json();
        if (!resultData.success) throw new Error(resultData.message);
      }

      toast({ title: 'Saved', description: 'Data updated successfully' });

      setRows((p) =>
        p.map((r) => {
          if (r.yearly_target_id === yearlyTargetId) {
            const newUsedQuota = Object.values(r.months).reduce(
              (sum: number, m: any) => sum + (parseFloat(String(m.result)) || 0),
              0
            );
            return {
              ...r,
              used_quota: newUsedQuota,
              remaining_quota: (r.total_quota || 0) - newUsedQuota,
              months: {
                ...r.months,
                [month]: {
                  ...r.months[month],
                  saving: false,
                  dirty: false,
                  dirtyResult: false,
                  target: saveTarget ? parseFloat(monthData.draft) || 0 : r.months[month].target,
                  result: saveResult
                    ? parseFloat(monthData.draftResult) || 0
                    : r.months[month].result,
                },
              },
            };
          }
          return r;
        })
      );

      loadStats();
      calculateTotalTargetValues(String(dept), String(fiscalYear)).then((ct) =>
        setCategoryTargetValues(ct)
      );
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
    calculateTotalTargetValues(String(dept), String(fiscalYear)).then(({ values, counts }) => {
      setCategoryTargetValues(values);
      setCategoryTargetCounts(counts);
    });
  };

  return {
    user,
    fiscalYear,
    setFiscalYear,
    availableYears,
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
    canEdit,
    filteredRows,
    onChange,
    onChangeResult,
    onNoteChange,
    onAttachmentChange,
    saveMonthResult,
    refreshData,
  };
}
