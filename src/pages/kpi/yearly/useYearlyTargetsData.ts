import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { storage } from '@/shared/utils';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { Category, YearlyTarget, Stats, deriveCategoryValuesFromStats } from '../shared';

export type { YearlyTarget };
import { Attachment } from '@/components/kpi/AttachmentPanel';

export function useYearlyTargetsData(fiscalYear?: number, setFiscalYear?: (year: number) => void) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cat, setCat] = useState('');
  const [rows, setRows] = useState<YearlyTarget[]>([]);
  const [allRows, setAllRows] = useState<YearlyTarget[]>([]); // Store all rows for accurate counts
  const [depts, setDepts] = useState<{ dept_id: string }[]>([]);
  const [dept, setDept] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<'all' | number>('all');
  const [drafts, setDrafts] = useState<
    Record<number, { target: string; note: string; attachment: Attachment | null }>
  >({});
  const [categoryTargetValues, setCategoryTargetValues] = useState<Record<string, number>>({});
  const [categoryTargetCounts, setCategoryTargetCounts] = useState<Record<string, number>>({});
  const [categoryResultCounts, setCategoryResultCounts] = useState<Record<string, number>>({});

  const { lastEvent } = useRealtimeSync({ fiscalYear, dept, category: cat || undefined });

  const canEdit = ['manager', 'admin', 'superadmin'].includes(user?.role ?? '');

  const filteredRows = useMemo(() => {
    let result = rows;

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
      result = rows.filter(
        (row) =>
          row.measurement?.toLowerCase().includes(query) ||
          row.category_name?.toLowerCase().includes(query) ||
          row.sub_category_name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [rows, searchQuery, categories]);

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
    if (!dept || !fiscalYear) return;
    try {
      const r = await fetch(`/api/kpi-forms/yearly/${dept}/${fiscalYear}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const d = await r.json();
      if (d.success && Array.isArray(d.data)) {
        setAllRows(d.data); // Store all rows for accurate counts
      }
    } catch (err) {
      console.error('Failed to load all rows:', err);
    }
  }, [dept, fiscalYear]);

  useEffect(() => {
    if (dept && fiscalYear) {
      loadStats();
      loadAllRows(); // Load all rows for actual counts calculation
    }
  }, [dept, fiscalYear, loadAllRows]);
  useEffect(() => {
    if (cat && dept && fiscalYear && allRows.length > 0) loadRows();
  }, [cat, dept, String(fiscalYear), allRows]);
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

      // Calculate result counts (filled targets) based on all rows data
      const resultCounts: Record<string, number> = {};
      categories.forEach((cat) => {
        const filledTargets = allRows.filter(
          (row) =>
            row.category_key === cat.key &&
            (row.total_target > 0 ||
              row.description_of_target ||
              row.company_policy ||
              row.department_policy)
        );
        resultCounts[cat.key] = filledTargets.length;
      });
      setCategoryResultCounts(resultCounts);
    }
  }, [dept, String(fiscalYear), categories, stats, allRows]);

  const loadCategories = async () => {
    try {
      const r = await fetch('/api/kpi-forms/categories');
      const d = await r.json();
      if (d.success && Array.isArray(d.data)) {
        setCategories(d.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  };

  const loadDepts = async () => {
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
    } catch (err) {
      console.error('Failed to load departments:', err);
      setDepts([]);
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

  const loadRows = async () => {
    if (!dept || !fiscalYear || !cat) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/kpi-forms/yearly/${dept}/${fiscalYear}?category=${cat}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const d = await r.json();
      if (d.success && Array.isArray(d.data)) {
        setRows(d.data);
        const initialDrafts: Record<
          number,
          { target: string; note: string; attachment: Attachment | null }
        > = {};
        d.data.forEach((row: YearlyTarget) => {
          initialDrafts[row.id] = {
            target: (row.total_target ?? 0).toString(),
            note: row.description_of_target || '',
            attachment: null,
          };
        });
        setDrafts(initialDrafts);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const saveRow = async (row: YearlyTarget, toast: any) => {
    const draft = drafts[row.id];
    if (!draft) return;

    try {
      setRows((p) => p.map((r) => (r.id !== row.id ? r : { ...r, saving: true })));

      const response = await fetch(`/api/kpi-forms/yearly/${row.id}/quota`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify({
          total_quota: parseFloat(draft.target),
          description_of_target: draft.note || null,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      toast({
        title: 'Saved',
        description: `Target set to ${parseFloat(draft.target).toLocaleString()}`,
      });
      loadRows();
      loadAllRows(); // Update all rows for accurate counts
      loadStats();
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to save target',
        variant: 'destructive',
      });
      setRows((p) => p.map((r) => (r.id !== row.id ? r : { ...r, saving: false })));
    }
  };

  const onChange = (id: number, value: string) => {
    setDrafts((p) => ({ ...p, [id]: { ...p[id], target: value } }));
    setRows((p) => p.map((r) => (r.id !== id ? r : { ...r, dirty: true })));
  };

  const onNoteChange = (id: number, value: string) => {
    setDrafts((p) => ({ ...p, [id]: { ...p[id], note: value } }));
    setRows((p) => p.map((r) => (r.id !== id ? r : { ...r, dirty: true })));
  };

  const onAttachmentChange = (id: number, attachment: Attachment | null) => {
    setDrafts((p) => ({ ...p, [id]: { ...p[id], attachment } }));
    setRows((p) => p.map((r) => (r.id !== id ? r : { ...r, dirty: true })));
  };

  const refreshData = useCallback(() => {
    loadStats();
    loadAllRows(); // Refresh all rows for accurate counts
    if (cat) loadRows();
  }, [loadStats, loadAllRows, cat]);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === 'api_change') {
      refreshData();
    }
  }, [lastEvent, refreshData]);

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
    showAddModal,
    setShowAddModal,
    searchQuery,
    setSearchQuery,
    selectedMonth,
    setSelectedMonth,
    drafts,
    setDrafts,
    categoryTargetValues,
    categoryTargetCounts,
    categoryResultCounts,
    canEdit,
    filteredRows,
    onChange,
    onNoteChange,
    onAttachmentChange,
    saveRow,
    refreshData,
  };
}
