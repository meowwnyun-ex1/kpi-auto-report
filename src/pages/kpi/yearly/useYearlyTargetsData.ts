import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/shared/utils';
import { Category, YearlyTarget, Stats, useCalculateTotalTargetValues } from '../shared';

export type { YearlyTarget };
import { Attachment } from '@/components/kpi/AttachmentPanel';

export function useYearlyTargetsData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYear();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cat, setCat] = useState('');
  const [rows, setRows] = useState<YearlyTarget[]>([]);
  const [depts, setDepts] = useState<{ dept_id: string }[]>([]);
  const [dept, setDept] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<'all' | number>('all');
  const [drafts, setDrafts] = useState<
    Record<number, { target: string; note: string; attachment: Attachment | null }>
  >({});
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
  }, [cat, dept, String(fiscalYear)]);
  useEffect(() => {
    if (dept && fiscalYear && categories.length > 0) {
      calculateTotalTargetValues(String(dept), String(fiscalYear)).then(({ values, counts }) => {
        setCategoryTargetValues(values);
        setCategoryTargetCounts(counts);
      });
    }
  }, [dept, String(fiscalYear), categories, calculateTotalTargetValues]);

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
      const r = await fetch(`/api/kpi-forms/yearly/${dept}/${fiscalYear}?category=${cat}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const d = await r.json();
      if (d.success) {
        setRows(d.data);
        const initialDrafts: Record<
          number,
          { target: string; note: string; attachment: Attachment | null }
        > = {};
        d.data.forEach((row: YearlyTarget) => {
          initialDrafts[row.id] = {
            target: row.total_target.toString(),
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
      loadStats();
      calculateTotalTargetValues(String(dept), String(fiscalYear)).then(({ values, counts }) => {
        setCategoryTargetValues(values);
        setCategoryTargetCounts(counts);
      });
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
    showAddModal,
    setShowAddModal,
    searchQuery,
    setSearchQuery,
    selectedMonth,
    setSelectedMonth,
    drafts,
    categoryTargetValues,
    categoryTargetCounts,
    canEdit,
    filteredRows,
    onChange,
    onNoteChange,
    onAttachmentChange,
    saveRow,
    refreshData,
  };
}
