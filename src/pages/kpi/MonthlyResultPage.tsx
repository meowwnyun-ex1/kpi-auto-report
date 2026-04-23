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
  XCircle,
  Circle,
  Loader2,
  AlertCircle,
  MinusCircle,
  Building2,
  Calendar,
  CalendarDays,
} from 'lucide-react';
import { storage } from '@/shared/utils';
import { AttachmentPanel, type Attachment } from '@/components/kpi/AttachmentPanel';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';
import { TableContainer } from '@/components/shared/TableContainer';

// Types
interface Category {
  id: number;
  name: string;
  key: string;
}

interface MonthlyResult {
  id: number;
  yearly_target_id: number;
  category_id: number;
  measurement: string | null;
  unit: string | null;
  main: string | null;
  main_relate_display: string | null;
  month: number;
  target: number | null;
  result: number | null;
  draft: string;
  draftNote: string;
  draftAttachment: Attachment | null;
  expanded: boolean;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
}

interface YearlyTargetWithMonths {
  yearly_target_id: number;
  measurement: string | null;
  unit: string | null;
  main: string | null;
  main_relate_display: string | null;
  fy_target: number | null;
  total_quota: number | null;
  used_quota: number | null;
  remaining_quota: number | null;
  months: Record<
    number,
    {
      id: number;
      target: number | null;
      result: number | null;
      note: string | null;
      image_url: string | null;
      image_caption: string | null;
      draft: string;
      draftNote: string;
      draftAttachment: Attachment | null;
      dirty: boolean;
      saving: boolean;
    }
  >;
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

const MONTHS = [
  { v: 4, l: 'Apr' },
  { v: 5, l: 'May' },
  { v: 6, l: 'Jun' },
  { v: 7, l: 'Jul' },
  { v: 8, l: 'Aug' },
  { v: 9, l: 'Sep' },
  { v: 10, l: 'Oct' },
  { v: 11, l: 'Nov' },
  { v: 12, l: 'Dec' },
  { v: 1, l: 'Jan' },
  { v: 2, l: 'Feb' },
  { v: 3, l: 'Mar' },
];

export default function MonthlyResultPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYear();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cat, setCat] = useState('');
  const [rows, setRows] = useState<YearlyTargetWithMonths[]>([]);
  const [depts, setDepts] = useState<{ dept_id: string }[]>([]);
  const [dept, setDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      // Fetch yearly targets first
      const yearlyRes = await fetch(`/api/kpi-forms/yearly/${dept}/${fiscalYear}?category=${cat}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const yearlyData = await yearlyRes.json();

      if (!yearlyData.success) return;

      // Fetch all monthly data for these yearly targets
      const monthlyRes = await fetch(
        `/api/kpi-forms/monthly/${dept}/${fiscalYear}?category=${cat}`,
        { headers: { Authorization: `Bearer ${storage.getAuthToken()}` } }
      );
      const monthlyData = await monthlyRes.json();

      if (!monthlyData.success) return;

      // Combine yearly and monthly data
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
            draft: (m.result ?? 0).toString(),
            draftNote: m.note ?? '',
            draftAttachment: m.image_url ? { url: m.image_url, caption: m.image_caption } : null,
            dirty: false,
            saving: false,
          };
        });

        // Calculate used quota from actual monthly results
        const usedQuota = Object.values(months).reduce((sum, month) => {
          const result = parseFloat(month.result) || 0;
          return sum + result;
        }, 0);

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

  const saveMonthResult = async (yearlyTargetId: number, month: number, monthData: any) => {
    try {
      // Update saving state for this specific month
      setRows((p) =>
        p.map((r) => {
          if (r.yearly_target_id === yearlyTargetId && r.months[month]) {
            return {
              ...r,
              months: {
                ...r.months,
                [month]: { ...r.months[month], saving: true },
              },
            };
          }
          return r;
        })
      );

      const response = await fetch(`/api/kpi-forms/monthly/${monthData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify({
          result: parseFloat(monthData.draft) || 0,
          note: monthData.draftNote || null,
          image_url: monthData.draftAttachment?.url || null,
          image_caption: monthData.draftAttachment?.caption || null,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      toast({
        title: 'Saved',
        description: `Result updated to ${parseFloat(monthData.draft).toLocaleString()}`,
      });

      // Update used_quota locally for immediate feedback
      setRows((p) =>
        p.map((r) => {
          if (r.yearly_target_id === yearlyTargetId) {
            // Recalculate used quota
            const newUsedQuota = Object.values(r.months).reduce((sum, m) => {
              const result =
                m.id === monthData.id
                  ? parseFloat(monthData.draft) || 0
                  : parseFloat(String(m.result)) || 0;
              return sum + result;
            }, 0);

            return {
              ...r,
              used_quota: newUsedQuota,
              remaining_quota: (r.total_quota || 0) - newUsedQuota,
              months: {
                ...r.months,
                [month]: { ...r.months[month], saving: false, dirty: false },
              },
            };
          }
          return r;
        })
      );

      // Reload data to get updated stats
      loadStats();
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to save result',
        variant: 'destructive',
      });

      // Reset saving state
      setRows((p) =>
        p.map((r) => {
          if (r.yearly_target_id === yearlyTargetId && r.months[month]) {
            return {
              ...r,
              months: {
                ...r.months,
                [month]: { ...r.months[month], saving: false },
              },
            };
          }
          return r;
        })
      );
    }
  };

  const onChange = (yearlyTargetId: number, month: number, value: string) => {
    setRows((p) =>
      p.map((r) => {
        if (r.yearly_target_id === yearlyTargetId && r.months[month]) {
          return {
            ...r,
            months: {
              ...r.months,
              [month]: { ...r.months[month], draft: value, dirty: true },
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
            months: {
              ...r.months,
              [month]: { ...r.months[month], draftNote: value, dirty: true },
            },
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

  const selectedCatName = categories.find((c) => c.key === cat)?.name ?? '';
  const selectedCatCfg = cat ? (CAT[cat] ?? { color: '#059669', icon: Target }) : null;

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
          <span className="text-xs text-gray-400 mb-0.5">results</span>
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
        title={cat ? selectedCatName : 'Monthly Results'}
        subtitle={undefined}
        icon={cat && selectedCatCfg ? selectedCatCfg.icon : Target}
        iconColor={cat && selectedCatCfg ? selectedCatCfg.color : 'text-emerald-600'}
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
        theme="emerald">
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
          /* Monthly results table */
          <div className="flex-1 p-6 bg-gray-50/60">
            {loading ? (
              <TableContainer
                icon={Target}
                title="Monthly Results"
                subtitle="Enter actual results against monthly targets"
                theme="emerald"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by measurement..."
                loading
              />
            ) : filteredRows.length === 0 ? (
              <TableContainer
                icon={Target}
                title="Monthly Results"
                subtitle="Enter actual results against monthly targets"
                theme="emerald"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by measurement..."
                empty
                emptyTitle="No KPIs found"
                emptyDescription={`No monthly results found for ${dept} · FY ${fiscalYear} · ${selectedCatName}. Enter monthly results to track KPI performance.`}
              />
            ) : (
              <TableContainer
                icon={Target}
                title="Monthly Results - All Months"
                subtitle="Enter actual results against monthly targets for all 12 months"
                badge={`${filteredRows.length} KPIs`}
                totalCount={filteredRows.length}
                theme="emerald"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by measurement..."
                legendItems={[
                  { color: 'bg-emerald-500', label: 'Complete' },
                  { color: 'bg-gray-300', label: 'Pending' },
                ]}>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-emerald-50 to-green-100 sticky top-0 z-10">
                      <TableRow className="border-b border-gray-300">
                        <TableHead className="w-12 text-center text-xs font-bold text-gray-700 bg-emerald-50 pl-6 py-4">
                          #
                        </TableHead>
                        <TableHead className="text-xs font-bold text-gray-700 min-w-[250px] bg-emerald-50 py-4">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-600" />
                            Measurement
                          </div>
                        </TableHead>
                        <TableHead className="w-20 text-right text-xs font-bold text-gray-700 bg-emerald-50 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <CalendarDays className="w-3 h-3" />
                            FY Target
                          </div>
                        </TableHead>
                        <TableHead className="w-20 text-right text-xs font-bold text-gray-700 bg-emerald-50 py-4">
                          Used
                        </TableHead>
                        <TableHead className="w-20 text-right text-xs font-bold text-gray-700 bg-emerald-50 py-4">
                          Remaining
                        </TableHead>
                        {MONTHS.map((m) => (
                          <TableHead
                            key={m.v}
                            className="w-24 text-center text-xs font-bold text-gray-700 bg-emerald-50 py-4">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs">{m.l}</span>
                              <span className="text-[10px] text-gray-500">T/R</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.map((row, i) => (
                        <TableRow
                          key={row.yearly_target_id}
                          className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors">
                          <TableCell className="text-center text-xs font-mono text-gray-400 font-bold pl-6 py-4 bg-emerald-50/50">
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
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-4 bg-gray-50/30">
                            <div className="font-mono text-sm font-bold text-gray-700">
                              {row.fy_target?.toLocaleString() || '---'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-4 bg-gray-50/30">
                            <div className="font-mono text-sm font-bold text-orange-600">
                              {row.used_quota?.toLocaleString() || '0'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-4 bg-gray-50/30">
                            <div className="font-mono text-sm font-bold text-blue-600">
                              {row.remaining_quota?.toLocaleString() ||
                                row.fy_target?.toLocaleString() ||
                                '---'}
                            </div>
                          </TableCell>
                          {MONTHS.map((m) => {
                            const monthData = row.months[m.v];
                            return (
                              <TableCell key={m.v} className="text-center py-4 bg-white">
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500">
                                    {monthData?.target?.toLocaleString() || '---'}
                                  </div>
                                  {canEdit ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      className="w-20 h-7 text-center text-xs bg-white border-emerald-200"
                                      value={monthData?.draft || ''}
                                      onChange={(e) =>
                                        onChange(row.yearly_target_id, m.v, e.target.value)
                                      }
                                      placeholder="0"
                                    />
                                  ) : (
                                    <div className="font-mono text-xs font-bold text-emerald-600">
                                      {monthData?.result?.toLocaleString() || '---'}
                                    </div>
                                  )}
                                  {monthData?.dirty && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 px-2 text-[10px] border-emerald-200 hover:bg-emerald-50"
                                      onClick={() =>
                                        saveMonthResult(row.yearly_target_id, m.v, monthData)
                                      }
                                      disabled={monthData?.saving}>
                                      {monthData?.saving ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Save className="w-3 h-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TableContainer>
            )}
          </div>
        )}
      </StandardPageLayout>
    </ShellLayout>
  );
}
