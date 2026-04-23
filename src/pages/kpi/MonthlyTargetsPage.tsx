import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShellLayout } from '@/features/shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Target,
  RefreshCw,
  ChevronLeft,
  CheckCircle,
  Circle,
  Loader2,
  AlertCircle,
  Building2,
  CalendarDays,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { storage } from '@/shared/utils';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';
import { TableContainer } from '@/components/shared/TableContainer';
import { TOAST_MESSAGES } from '@/shared/constants';

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
  total_target: number;
  used_quota: number;
  remaining_quota: number;
  fy_target: number | null;
}

interface MonthlyTarget {
  id: number;
  yearly_target_id: number;
  month: number;
  target: number | null;
  result: number | null;
  note: string | null;
  image_url: string | null;
  image_caption: string | null;
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

export default function MonthlyTargetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYear();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cat, setCat] = useState('');
  const [yearlyTargets, setYearlyTargets] = useState<YearlyTarget[]>([]);
  const [monthlyTargets, setMonthlyTargets] = useState<MonthlyTarget[]>([]);
  const [depts, setDepts] = useState<{ dept_id: string }[]>([]);
  const [dept, setDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const canEdit = ['manager', 'admin', 'superadmin'].includes(user?.role ?? '');

  // Filter yearly targets based on search
  const filteredYearlyTargets = useMemo(() => {
    if (!searchQuery.trim()) {
      return yearlyTargets;
    }
    const query = searchQuery.toLowerCase();
    return yearlyTargets.filter((target) => target.measurement?.toLowerCase().includes(query));
  }, [yearlyTargets, searchQuery]);

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
    if (cat && dept && fiscalYear) {
      // Load monthly targets first, then yearly targets with calculated quotas
      loadMonthlyTargets().then(() => {
        loadYearlyTargets();
      });
    }
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

  const loadYearlyTargets = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/kpi-forms/yearly/${dept}/${fiscalYear}?category=${cat}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const d = await r.json();
      if (d.success) {
        // Calculate used quota from monthly targets for consistency
        const targets = d.data.map((target: YearlyTarget) => {
          const monthlyUsed = monthlyTargets
            .filter((mt) => mt.yearly_target_id === target.id)
            .reduce((sum, mt) => sum + (mt.target || 0), 0);

          return {
            ...target,
            used_quota: monthlyUsed,
            remaining_quota: target.total_target - monthlyUsed,
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
      if (d.success) {
        setMonthlyTargets(d.data);
      }
    } catch {
      /* silent */
    }
  };

  const saveMonthlyTarget = async (
    yearlyTargetId: number,
    month: number,
    target: number,
    comment?: string
  ) => {
    try {
      const res = await fetch(`/api/kpi-forms/monthly/${yearlyTargetId}/${month}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify({
          target,
          comment: comment || null,
        }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.message);

      toast({
        title: 'Target Saved',
        description: `Target set to ${target.toLocaleString()}`,
      });
      loadStats();
      // Reload monthly targets first, then yearly targets to update quotas
      loadMonthlyTargets().then(() => {
        loadYearlyTargets();
      });
    } catch (e: any) {
      toast({
        title: 'Save Failed',
        description: e.message || TOAST_MESSAGES.SAVE_FAILED,
        variant: 'destructive',
      });
    }
  };

  const getMonthlyTarget = (yearlyTargetId: number, month: number) => {
    return monthlyTargets.find(
      (mt) => mt.yearly_target_id === yearlyTargetId && mt.month === month
    );
  };

  // Enhanced status indicators
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
        icon: CheckCircle,
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
        icon: Target,
      };
    }

    return {
      status: 'not_set',
      color: 'gray',
      text: 'Not Set',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-400',
      borderColor: 'border-gray-200',
      icon: Circle,
    };
  };

  const selectedCatName = categories.find((c) => c.key === cat)?.name ?? '';
  const selectedCatCfg = cat ? (CAT[cat] ?? { color: '#6B7280', icon: Target }) : null;

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
        title={cat ? selectedCatName : 'Monthly Targets'}
        subtitle={undefined}
        icon={cat && selectedCatCfg ? selectedCatCfg.icon : Target}
        iconColor={cat && selectedCatCfg ? selectedCatCfg.color : 'text-blue-600'}
        showBackButton={!!cat}
        onBackClick={() => setCat('')}
        badge={
          cat
            ? `${yearlyTargets.length} ${yearlyTargets.length === 1 ? 'item' : 'items'}`
            : undefined
        }
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
          if (cat) {
            loadMonthlyTargets().then(() => {
              loadYearlyTargets();
            });
          }
        }}
        loading={statsLoading}
        theme="blue">
        {!cat ? (
          /* Category grid */
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((c) => (
                <CatCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        ) : (
          /* Monthly distribution table */
          <div className="bg-gray-50/60">
            {loading ? (
              <TableContainer
                icon={CalendarDays}
                title="Monthly Distribution"
                subtitle="Distribute yearly targets across 12 months"
                theme="blue"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by measurement..."
                loading
              />
            ) : filteredYearlyTargets.length === 0 ? (
              <TableContainer
                icon={CalendarDays}
                title="Monthly Distribution"
                subtitle="Distribute yearly targets across 12 months"
                theme="blue"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by measurement..."
                empty
                emptyTitle="No KPIs found"
                emptyDescription={`No yearly targets found for ${dept} · FY ${fiscalYear} · ${selectedCatName}. Create yearly targets first, then distribute them to months here.`}
              />
            ) : (
              <TableContainer
                icon={CalendarDays}
                title="Monthly Distribution"
                subtitle="Distribute yearly targets across 12 months"
                badge={`${filteredYearlyTargets.length} targets`}
                totalCount={filteredYearlyTargets.length}
                theme="blue"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by measurement..."
                legendItems={[
                  { color: 'bg-green-500', label: 'Active' },
                  { color: 'bg-gray-300', label: 'Draft' },
                ]}>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 sticky top-0 z-10">
                      <TableRow className="border-b border-gray-300">
                        <TableHead className="w-12 text-center text-xs font-bold text-gray-700 bg-blue-50 pl-6 py-4">
                          #
                        </TableHead>
                        <TableHead className="text-xs font-bold text-gray-700 min-w-[280px] bg-blue-50 py-4">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            Measurement
                          </div>
                        </TableHead>
                        <TableHead className="w-32 text-right text-xs font-bold text-blue-600 bg-blue-50 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <CalendarDays className="w-3 h-3" />
                            Target
                          </div>
                        </TableHead>
                        <TableHead className="w-32 text-right text-xs font-bold text-orange-600 bg-blue-50 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Used
                          </div>
                        </TableHead>
                        <TableHead className="w-32 text-right text-xs font-bold text-emerald-600 bg-blue-50 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Remaining
                          </div>
                        </TableHead>
                        {/* Enhanced month columns */}
                        {MONTHS.map((month) => (
                          <TableHead
                            key={month.v}
                            className="w-28 text-center text-xs font-bold text-gray-700 bg-gradient-to-b from-blue-50 to-blue-100 border-l border-blue-200 py-4">
                            <div className="flex flex-col items-center gap-1">
                              <div className="text-xs font-bold text-gray-700">{month.l}</div>
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredYearlyTargets.map((row, i) => {
                        const usedPct =
                          row.total_target > 0
                            ? Math.min(100, Math.round((row.used_quota / row.total_target) * 100))
                            : 0;
                        return (
                          <React.Fragment key={row.id}>
                            <TableRow className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors group">
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
                              {/* Enhanced month cells with status indicators */}
                              {MONTHS.map((month) => {
                                const status = getTargetStatus(row.id, month.v);
                                const StatusIcon = status.icon;
                                const mt = getMonthlyTarget(row.id, month.v);

                                return (
                                  <TableCell
                                    key={month.v}
                                    className="text-center py-4 bg-white border-l border-gray-100 w-28">
                                    <div className="flex flex-col items-center gap-1">
                                      {canEdit ? (
                                        <Input
                                          type="number"
                                          min="0"
                                          max={row.remaining_quota}
                                          className="w-24 h-8 text-center text-xs bg-white border-gray-200 focus:border-blue-400 font-mono"
                                          placeholder="0"
                                          defaultValue={mt?.target?.toString() || ''}
                                          onBlur={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            if (value > row.remaining_quota) {
                                              toast({
                                                title: 'Invalid Target',
                                                description: `Target cannot exceed remaining quota of ${row.remaining_quota.toLocaleString()}`,
                                                variant: 'destructive',
                                              });
                                              e.target.value = mt?.target?.toString() || '';
                                              return;
                                            }
                                            if (value !== (mt?.target || 0)) {
                                              saveMonthlyTarget(row.id, month.v, value);
                                            }
                                          }}
                                        />
                                      ) : (
                                        <div className="font-mono text-xs font-bold text-gray-700 min-h-[32px] flex items-center justify-center">
                                          {mt?.target?.toLocaleString() || '---'}
                                        </div>
                                      )}
                                      <span
                                        className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${status.bgColor} ${status.textColor} ${status.borderColor}`}>
                                        <StatusIcon className="w-2.5 h-2.5" />
                                        {status.text}
                                      </span>
                                    </div>
                                  </TableCell>
                                );
                              })}
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
    </ShellLayout>
  );
}
