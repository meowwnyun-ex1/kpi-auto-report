import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShellLayout } from '@/features/shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import {
  Shield,
  Award,
  Truck,
  FileCheck,
  Users,
  Star,
  Leaf,
  DollarSign,
  Save,
  Target,
  RefreshCw,
  ChevronLeft,
  CheckCircle,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { storage } from '@/shared/utils';
import { AttachmentPanel, type Attachment } from '@/components/kpi/AttachmentPanel';
import { AddTargetModal } from '@/components/kpi/AddTargetModal';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';
import { TableContainer } from '@/components/shared/TableContainer';

// Types
interface Category {
  id: number;
  name: string;
  key: string;
}

interface YearlyTarget {
  id: number;
  category_id: number;
  measurement: string | null;
  unit: string | null;
  main: string | null;
  main_relate_display: string | null;
  fy_target: number | null;
  total_target: number;
  used_quota: number;
  remaining_quota: number;
  description_of_target: string | null;
  saving?: boolean;
  dirty?: boolean;
}

interface Stats {
  yearly: number;
  months: Record<number, { targets: { set: number } }>;
}

// Constants
const CAT: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  safety: { color: '#DC2626', icon: Shield },
  quality: { color: '#16A34A', icon: Award },
  delivery: { color: '#2563EB', icon: Truck },
  compliance: { color: '#9333EA', icon: FileCheck },
  hr: { color: '#EA580C', icon: Users },
  attractive: { color: '#DB2777', icon: Star },
  environment: { color: '#0D9488', icon: Leaf },
  cost: { color: '#4F46E5', icon: DollarSign },
};

export default function YearlyTargetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYear();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cat, setCat] = useState('');
  const [rows, setRows] = useState<YearlyTarget[]>([]);
  const [depts, setDepts] = useState<{ dept_id: string }[]>([]);
  const [dept, setDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Draft state for editing
  const [drafts, setDrafts] = useState<
    Record<number, { target: string; note: string; attachment: Attachment | null }>
  >({});

  const canEdit = ['manager', 'admin', 'superadmin'].includes(user?.role ?? '');

  // Filter rows based on search
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) {
      return rows;
    }
    const query = searchQuery.toLowerCase();
    return rows.filter((row) => row.measurement?.toLowerCase().includes(query));
  }, [rows, searchQuery]);

  // Init
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
        // Filter departments based on user role
        const filteredDepts =
          user?.role === 'manager'
            ? d.data.filter((dept: any) => dept.dept_id === user?.department_id)
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
        // Initialize drafts
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

  const saveRow = async (row: YearlyTarget) => {
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
    setDrafts((p) => ({
      ...p,
      [id]: { ...p[id], target: value },
    }));
    setRows((p) => p.map((r) => (r.id !== id ? r : { ...r, dirty: true })));
  };

  const onNoteChange = (id: number, value: string) => {
    setDrafts((p) => ({
      ...p,
      [id]: { ...p[id], note: value },
    }));
    setRows((p) => p.map((r) => (r.id !== id ? r : { ...r, dirty: true })));
  };

  const onAttachmentChange = (id: number, attachment: Attachment | null) => {
    setDrafts((p) => ({
      ...p,
      [id]: { ...p[id], attachment },
    }));
    setRows((p) => p.map((r) => (r.id !== id ? r : { ...r, dirty: true })));
  };

  const selectedCatName = categories.find((c) => c.key === cat)?.name ?? '';
  const selectedCatCfg = cat ? (CAT[cat] ?? { color: '#6B7280', icon: Target }) : null;

  // Status chip
  const StatusChip = ({ row }: { row: YearlyTarget }) => {
    if (row.saving)
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-blue-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving
        </span>
      );
    if (row.dirty)
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-medium">
          <AlertCircle className="w-3 h-3" />
          Edited
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-green-500">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    );
  };

  // Category card
  const CatCard = ({ c }: { c: Category }) => {
    const cfg = CAT[c.key] ?? { color: '#6B7280', icon: Target };
    const Icon = cfg.icon;
    const count = stats[c.key]?.yearly ?? 0;
    return (
      <button
        key={c.id}
        onClick={() => setCat(c.key)}
        className="group relative flex flex-col p-5 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all text-left focus:outline-none"
        style={{ borderLeftColor: cfg.color, borderLeftWidth: 4 }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ background: `${cfg.color}18` }}>
          <span style={{ color: cfg.color }}>
            <Icon className="w-5 h-5" />
          </span>
        </div>
        <p className="text-sm font-semibold text-gray-800">{c.name}</p>
        <div className="mt-3 flex items-end gap-1.5">
          <span
            className="text-3xl font-black leading-none"
            style={{ color: count > 0 ? cfg.color : '#E5E7EB' }}>
            {count}
          </span>
          <span className="text-xs text-gray-400 mb-0.5">targets</span>
        </div>
        <div className="absolute right-3 bottom-3 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-3 h-3 text-gray-500 rotate-180" />
        </div>
        {statsLoading && <div className="absolute inset-0 bg-white/40 rounded-2xl" />}
      </button>
    );
  };

  return (
    <ShellLayout>
      <StandardPageLayout
        title={cat ? selectedCatName : 'Yearly Targets'}
        subtitle={undefined}
        icon={cat && selectedCatCfg ? selectedCatCfg.icon : Target}
        iconColor={cat && selectedCatCfg ? selectedCatCfg.color : 'text-gray-600'}
        showBackButton={!!cat}
        onBackClick={() => setCat('')}
        badge={cat ? `${rows.length} ${rows.length === 1 ? 'item' : 'items'}` : undefined}
        department={dept}
        fiscalYear={fiscalYear}
        availableYears={availableYears}
        onDepartmentChange={(v) => {
          setDept(v);
          setCat('');
        }}
        onFiscalYearChange={(v) => {
          setFiscalYear(v);
          setCat('');
        }}
        onRefresh={() => {
          loadStats();
          if (cat) loadRows();
        }}
        loading={statsLoading}
        theme="gray">
        {!cat ? (
          /* Category grid */
          <div className="p-6">
            {dept && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> {dept} · FY {fiscalYear}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((c) => (
                <CatCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        ) : (
          /* Yearly targets table */
          <div className="flex-1 p-6 bg-gray-50/60">
            {loading ? (
              <TableContainer
                icon={Target}
                title="Annual KPI Targets"
                subtitle="Set yearly targets and distribute to departments"
                theme="gray"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by measurement..."
                searchActions={
                  canEdit && (
                    <Button
                      size="sm"
                      className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setShowAddModal(true)}>
                      <Target className="w-3.5 h-3.5 mr-1.5" />
                      Add New Target
                    </Button>
                  )
                }
                loading
              />
            ) : filteredRows.length === 0 ? (
              <TableContainer
                icon={Target}
                title="Annual KPI Targets"
                subtitle="Set yearly targets and distribute to departments"
                theme="gray"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by measurement..."
                searchActions={
                  canEdit && (
                    <Button
                      size="sm"
                      className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setShowAddModal(true)}>
                      <Target className="w-3.5 h-3.5 mr-1.5" />
                      Add New Target
                    </Button>
                  )
                }
                empty
                emptyTitle="No KPIs found"
                emptyDescription={`No yearly targets found for ${dept} · FY ${fiscalYear} · ${selectedCatName}. Create yearly targets to set annual KPI goals.`}
              />
            ) : (
              <TableContainer
                icon={Target}
                title="Annual KPI Targets"
                subtitle="Set yearly targets and distribute to departments"
                badge={`${filteredRows.length} targets`}
                theme="gray"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by measurement..."
                searchActions={
                  canEdit && (
                    <Button
                      size="sm"
                      className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setShowAddModal(true)}>
                      <Target className="w-3.5 h-3.5 mr-1.5" />
                      Add New Target
                    </Button>
                  )
                }
                legendItems={[
                  { color: 'bg-green-500', label: 'Active' },
                  { color: 'bg-gray-300', label: 'Draft' },
                ]}>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                      <TableRow className="border-b border-gray-300">
                        <TableHead className="w-12 text-center text-xs font-bold text-gray-700 bg-gray-50 pl-6 py-4">
                          #
                        </TableHead>
                        <TableHead className="text-xs font-bold text-gray-700 min-w-[280px] bg-gray-50 py-4">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-gray-600" />
                            Measurement
                          </div>
                        </TableHead>
                        <TableHead className="w-36 text-right text-xs font-bold text-gray-700 bg-gray-50 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Annual Pool
                          </div>
                        </TableHead>
                        <TableHead className="w-32 text-right text-xs font-bold text-orange-600 bg-gray-50 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Calendar className="w-3 h-3" />
                            Used
                          </div>
                        </TableHead>
                        <TableHead className="w-36 text-right text-xs font-bold text-emerald-600 bg-gray-50 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Calendar className="w-3 h-3" />
                            Remaining
                          </div>
                        </TableHead>
                        <TableHead className="w-32 text-center text-xs font-bold text-gray-700 bg-gray-50 py-4">
                          Status
                        </TableHead>
                        <TableHead className="w-16 text-center text-xs font-bold text-gray-700 bg-gray-50 pr-6 py-4">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.map((row, i) => {
                        const usedPct =
                          row.total_target > 0
                            ? Math.min(100, Math.round((row.used_quota / row.total_target) * 100))
                            : 0;
                        const draft = drafts[row.id];
                        return (
                          <React.Fragment key={row.id}>
                            <TableRow className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors group">
                              <TableCell className="text-center text-xs font-mono text-gray-400 font-bold pl-6 py-4 bg-gray-50/50">
                                {i + 1}
                              </TableCell>
                              <TableCell className="py-4 bg-white">
                                <div className="space-y-2">
                                  <p className="text-sm font-bold text-gray-900 leading-tight">
                                    {row.measurement ?? '---'}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {row.unit && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                        {row.unit}
                                      </span>
                                    )}
                                    {row.main && (
                                      <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                        <span className="font-semibold">Main:</span>
                                        <span>{row.main}</span>
                                      </span>
                                    )}
                                    {row.main_relate_display && (
                                      <span
                                        className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200"
                                        title="Related departments">
                                        <Building2 className="w-3 h-3" />
                                        <span className="truncate max-w-[120px]">
                                          {row.main_relate_display}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-4 bg-gray-50/30">
                                <div className="text-right">
                                  <div className="font-mono text-sm font-bold text-gray-700">
                                    {row.total_target.toLocaleString()}
                                  </div>
                                  {row.fy_target && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      FY: {row.fy_target.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-4 bg-orange-50/30">
                                <div className="text-right">
                                  <div className="font-mono text-sm font-bold text-orange-600">
                                    {row.used_quota.toLocaleString()}
                                  </div>
                                  {row.total_target > 0 && (
                                    <div className="text-xs text-orange-500 mt-0.5">
                                      {usedPct.toFixed(1)}%
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-4 bg-emerald-50/30">
                                <div className="text-right">
                                  <div className="font-mono text-sm font-bold text-emerald-600">
                                    {row.remaining_quota.toLocaleString()}
                                  </div>
                                  {row.total_target > 0 && (
                                    <div className="text-xs text-emerald-500 mt-0.5">
                                      {(100 - usedPct).toFixed(1)}%
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-4">
                                <StatusChip row={row} />
                              </TableCell>
                              <TableCell className="text-center pr-6 py-4">
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs border-gray-200 hover:bg-gray-50"
                                    onClick={() => saveRow(row)}
                                    disabled={row.saving}>
                                    {row.saving ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Save className="w-3 h-3" />
                                    )}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TableContainer>
            )}
          </div>
        )}
      </StandardPageLayout>

      {/* Add Target Modal */}
      {cat && (
        <AddTargetModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          categoryId={categories.find((c) => c.key === cat)?.id ?? 0}
          categoryName={selectedCatName}
          onSuccess={() => {
            loadRows();
            loadStats();
          }}
        />
      )}
    </ShellLayout>
  );
}
