import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  ClipboardList,
  GanttChart,
  Save,
  Check,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Eye,
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Types
interface Department {
  dept_id: string;
  name_en: string;
}

interface YearlyTarget {
  id?: number;
  category: string;
  metric_name: string;
  unit: string;
  fy_target: string;
  policy: string;
  key_action: string;
  responsible_person: string;
}

interface MonthlyEntry {
  id?: number;
  category: string;
  metric_name: string;
  month: number;
  target: string;
  result: string;
  ev: string;
}

interface ActionPlan {
  id?: number;
  key_action: string;
  action_plan: string;
  start_month: number;
  end_month: number;
  status: string;
  progress: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CATEGORIES = [
  'Safety',
  'Quality',
  'Delivery',
  'Compliance',
  'HR',
  'Attractive',
  'Environment',
  'Cost',
];
const STATUS_OPTIONS = ['Planned', 'In Progress', 'Completed', 'Delayed', 'Cancelled'];

export default function KPIManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Data states
  const [yearlyTargets, setYearlyTargets] = useState<YearlyTarget[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<MonthlyEntry[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);

  const canEdit = user?.role && ['manager', 'admin', 'superadmin'].includes(user.role);

  // Get active view and tab from URL
  const activeView = searchParams.get('view') || 'form'; // 'form' or 'dashboard'
  const activeTab = searchParams.get('tab') || 'yearly';

  // Set view handler
  const setView = (view: string) => {
    setSearchParams({ view, tab: activeTab });
  };

  useEffect(() => {
    fetchDepartments();
    // Set user's department if manager
    if (user?.department_id && !selectedDept) {
      setSelectedDept(user.department_id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedDept && selectedYear) {
      fetchData();
    }
  }, [selectedDept, selectedYear]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) setDepartments(data.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch yearly targets
      const yearlyRes = await fetch(`/api/kpi-forms/yearly/${selectedDept}/${selectedYear}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const yearlyData = await yearlyRes.json();
      if (yearlyData.success)
        setYearlyTargets(
          yearlyData.data.length > 0 ? yearlyData.data : [createEmptyYearlyTarget()]
        );

      // Fetch monthly entries
      const monthlyRes = await fetch(`/api/kpi-forms/monthly/${selectedDept}/${selectedYear}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const monthlyData = await monthlyRes.json();
      if (monthlyData.success)
        setMonthlyEntries(
          monthlyData.data.length > 0 ? monthlyData.data : [createEmptyMonthlyEntry()]
        );

      // Fetch action plans
      const actionRes = await fetch(`/api/kpi-forms/action-plans/${selectedDept}/${selectedYear}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const actionData = await actionRes.json();
      if (actionData.success)
        setActionPlans(actionData.data.length > 0 ? actionData.data : [createEmptyActionPlan()]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmptyYearlyTarget = (): YearlyTarget => ({
    category: 'Quality',
    metric_name: '',
    unit: '',
    fy_target: '',
    policy: '',
    key_action: '',
    responsible_person: '',
  });

  const createEmptyMonthlyEntry = (): MonthlyEntry => ({
    category: 'Quality',
    metric_name: '',
    month: 1,
    target: '',
    result: '',
    ev: '',
  });

  const createEmptyActionPlan = (): ActionPlan => ({
    key_action: '',
    action_plan: '',
    start_month: 1,
    end_month: 12,
    status: 'Planned',
    progress: 0,
  });

  // Yearly Targets handlers
  const addYearlyTarget = () => setYearlyTargets([...yearlyTargets, createEmptyYearlyTarget()]);
  const removeYearlyTarget = (index: number) =>
    setYearlyTargets(yearlyTargets.filter((_, i) => i !== index));
  const updateYearlyTarget = (index: number, field: keyof YearlyTarget, value: string) => {
    const updated = [...yearlyTargets];
    updated[index][field] = value;
    setYearlyTargets(updated);
  };

  // Monthly Entries handlers
  const addMonthlyEntry = () => setMonthlyEntries([...monthlyEntries, createEmptyMonthlyEntry()]);
  const removeMonthlyEntry = (index: number) =>
    setMonthlyEntries(monthlyEntries.filter((_, i) => i !== index));
  const updateMonthlyEntry = (index: number, field: keyof MonthlyEntry, value: string | number) => {
    const updated = [...monthlyEntries];
    updated[index][field] = value as never;
    setMonthlyEntries(updated);
  };

  // Action Plans handlers
  const addActionPlan = () => setActionPlans([...actionPlans, createEmptyActionPlan()]);
  const removeActionPlan = (index: number) =>
    setActionPlans(actionPlans.filter((_, i) => i !== index));
  const updateActionPlan = (index: number, field: keyof ActionPlan, value: string | number) => {
    const updated = [...actionPlans];
    updated[index][field] = value as never;
    setActionPlans(updated);
  };

  const saveData = async (type: 'yearly' | 'monthly' | 'actions') => {
    if (!canEdit) {
      toast({ title: 'Error', description: 'No permission to edit', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const endpoint =
        type === 'yearly'
          ? '/api/kpi-forms/yearly'
          : type === 'monthly'
            ? '/api/kpi-forms/monthly'
            : '/api/kpi-forms/action-plans';

      const body =
        type === 'yearly'
          ? { department_id: selectedDept, fiscal_year: selectedYear, targets: yearlyTargets }
          : type === 'monthly'
            ? { department_id: selectedDept, fiscal_year: selectedYear, entries: monthlyEntries }
            : { department_id: selectedDept, fiscal_year: selectedYear, plans: actionPlans };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Data saved successfully' });
        fetchData();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save data', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ShellLayout variant="sidebar">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">KPI Management</h1>
            <p className="text-muted-foreground">
              Yearly targets, monthly entries, and action plans
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.dept_id} value={d.dept_id}>
                    {d.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        {/* View Toggle - Form / Dashboard */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeView === 'form' ? 'default' : 'outline'}
            onClick={() => setView('form')}
            className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Form Entry
          </Button>
          <Button
            variant={activeView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard View
          </Button>
        </div>

        {/* Overview Summary */}
        {yearlyTargets.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview -{' '}
                {departments.find((d) => d.dept_id === selectedDept)?.name_en || selectedDept}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Yearly Targets:</span>
                  <span className="font-medium ml-2">
                    {yearlyTargets.filter((t) => t.metric_name).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Monthly Entries:</span>
                  <span className="font-medium ml-2">
                    {monthlyEntries.filter((m) => m.metric_name).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Action Plans:</span>
                  <span className="font-medium ml-2">
                    {actionPlans.filter((a) => a.key_action).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Categories:</span>
                  <span className="font-medium ml-2">
                    {new Set(yearlyTargets.map((t) => t.category)).size}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : activeView === 'dashboard' ? (
          /* Dashboard View - Show Results */
          <DashboardView
            yearlyTargets={yearlyTargets}
            monthlyEntries={monthlyEntries}
            actionPlans={actionPlans}
            selectedYear={selectedYear}
            selectedDept={selectedDept}
            departments={departments}
          />
        ) : (
          /* Form View - Data Entry */
          <Tabs
            value={activeTab}
            onValueChange={(v) => setSearchParams({ view: activeView, tab: v })}
            className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="yearly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Yearly Targets
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Monthly Entry
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <GanttChart className="h-4 w-4" />
                Action Plans
              </TabsTrigger>
            </TabsList>
            {/* Yearly Targets Tab */}
            <TabsContent value="yearly">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Yearly Targets - FY{selectedYear}</CardTitle>
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={addYearlyTarget}>
                        <Plus className="h-4 w-4 mr-1" /> Add Row
                      </Button>
                      <Button size="sm" onClick={() => saveData('yearly')} disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-28">Category</TableHead>
                          <TableHead>Metric</TableHead>
                          <TableHead className="w-20">Unit</TableHead>
                          <TableHead className="w-24">Target</TableHead>
                          <TableHead>Policy</TableHead>
                          <TableHead>Key Action</TableHead>
                          <TableHead className="w-28">PIC</TableHead>
                          {canEdit && <TableHead className="w-16"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearlyTargets.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Select
                                value={row.category}
                                onValueChange={(v) => updateYearlyTarget(i, 'category', v)}
                                disabled={!canEdit}>
                                <SelectTrigger className="border-0 bg-transparent">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CATEGORIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {c}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.metric_name}
                                onChange={(e) =>
                                  updateYearlyTarget(i, 'metric_name', e.target.value)
                                }
                                disabled={!canEdit}
                                className="border-0 bg-transparent"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.unit}
                                onChange={(e) => updateYearlyTarget(i, 'unit', e.target.value)}
                                disabled={!canEdit}
                                className="border-0 bg-transparent w-16"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.fy_target}
                                onChange={(e) => updateYearlyTarget(i, 'fy_target', e.target.value)}
                                disabled={!canEdit}
                                className="border-0 bg-transparent w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={row.policy}
                                onChange={(e) => updateYearlyTarget(i, 'policy', e.target.value)}
                                disabled={!canEdit}
                                className="border-0 bg-transparent min-h-[40px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={row.key_action}
                                onChange={(e) =>
                                  updateYearlyTarget(i, 'key_action', e.target.value)
                                }
                                disabled={!canEdit}
                                className="border-0 bg-transparent min-h-[40px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.responsible_person}
                                onChange={(e) =>
                                  updateYearlyTarget(i, 'responsible_person', e.target.value)
                                }
                                disabled={!canEdit}
                                className="border-0 bg-transparent"
                              />
                            </TableCell>
                            {canEdit && (
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeYearlyTarget(i)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monthly Entry Tab */}
            <TabsContent value="monthly">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Monthly Entry - FY{selectedYear}</CardTitle>
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={addMonthlyEntry}>
                        <Plus className="h-4 w-4 mr-1" /> Add Row
                      </Button>
                      <Button size="sm" onClick={() => saveData('monthly')} disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-28">Category</TableHead>
                          <TableHead>Metric</TableHead>
                          <TableHead className="w-20">Month</TableHead>
                          <TableHead className="w-24">Target</TableHead>
                          <TableHead className="w-24">Result</TableHead>
                          <TableHead className="w-16">EV</TableHead>
                          {canEdit && <TableHead className="w-16"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyEntries.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Select
                                value={row.category}
                                onValueChange={(v) => updateMonthlyEntry(i, 'category', v)}
                                disabled={!canEdit}>
                                <SelectTrigger className="border-0 bg-transparent">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CATEGORIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {c}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.metric_name}
                                onChange={(e) =>
                                  updateMonthlyEntry(i, 'metric_name', e.target.value)
                                }
                                disabled={!canEdit}
                                className="border-0 bg-transparent"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={row.month.toString()}
                                onValueChange={(v) => updateMonthlyEntry(i, 'month', parseInt(v))}
                                disabled={!canEdit}>
                                <SelectTrigger className="border-0 bg-transparent w-16">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {MONTHS.map((m, idx) => (
                                    <SelectItem key={idx} value={(idx + 1).toString()}>
                                      {m}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.target}
                                onChange={(e) => updateMonthlyEntry(i, 'target', e.target.value)}
                                disabled={!canEdit}
                                className="border-0 bg-transparent w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.result}
                                onChange={(e) => updateMonthlyEntry(i, 'result', e.target.value)}
                                disabled={!canEdit}
                                className="border-0 bg-transparent w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.ev}
                                onChange={(e) => updateMonthlyEntry(i, 'ev', e.target.value)}
                                disabled={!canEdit}
                                className="border-0 bg-transparent w-12"
                              />
                            </TableCell>
                            {canEdit && (
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeMonthlyEntry(i)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Action Plans Tab */}
            <TabsContent value="actions">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Action Plans - FY{selectedYear}</CardTitle>
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={addActionPlan}>
                        <Plus className="h-4 w-4 mr-1" /> Add Row
                      </Button>
                      <Button size="sm" onClick={() => saveData('actions')} disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Key Action</TableHead>
                          <TableHead>Action Plan</TableHead>
                          <TableHead className="w-24">Start</TableHead>
                          <TableHead className="w-24">End</TableHead>
                          <TableHead className="w-28">Status</TableHead>
                          <TableHead className="w-24">Progress</TableHead>
                          {canEdit && <TableHead className="w-16"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {actionPlans.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Input
                                value={row.key_action}
                                onChange={(e) => updateActionPlan(i, 'key_action', e.target.value)}
                                disabled={!canEdit}
                                className="border-0 bg-transparent"
                              />
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={row.action_plan}
                                onChange={(e) => updateActionPlan(i, 'action_plan', e.target.value)}
                                disabled={!canEdit}
                                className="border-0 bg-transparent min-h-[40px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={row.start_month.toString()}
                                onValueChange={(v) =>
                                  updateActionPlan(i, 'start_month', parseInt(v))
                                }
                                disabled={!canEdit}>
                                <SelectTrigger className="border-0 bg-transparent w-16">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {MONTHS.map((m, idx) => (
                                    <SelectItem key={idx} value={(idx + 1).toString()}>
                                      {m}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={row.end_month.toString()}
                                onValueChange={(v) => updateActionPlan(i, 'end_month', parseInt(v))}
                                disabled={!canEdit}>
                                <SelectTrigger className="border-0 bg-transparent w-16">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {MONTHS.map((m, idx) => (
                                    <SelectItem key={idx} value={(idx + 1).toString()}>
                                      {m}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={row.status}
                                onValueChange={(v) => updateActionPlan(i, 'status', v)}
                                disabled={!canEdit}>
                                <SelectTrigger className="border-0 bg-transparent w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${row.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs w-8">{row.progress}%</span>
                              </div>
                            </TableCell>
                            {canEdit && (
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeActionPlan(i)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ShellLayout>
  );
}

// Dashboard View Component - Shows Results
function DashboardView({
  yearlyTargets,
  monthlyEntries,
  actionPlans,
  selectedYear,
  selectedDept,
  departments,
}: {
  yearlyTargets: YearlyTarget[];
  monthlyEntries: MonthlyEntry[];
  actionPlans: ActionPlan[];
  selectedYear: number;
  selectedDept: string;
  departments: Department[];
}) {
  const [dashboardTab, setDashboardTab] = useState('overview');

  // Group data by category
  const categoryData = CATEGORIES.map((cat) => {
    const targets = yearlyTargets.filter((t) => t.category === cat);
    const entries = monthlyEntries.filter((m) => m.category === cat);
    return {
      category: cat,
      targetCount: targets.length,
      entryCount: entries.length,
      avgTarget:
        targets.length > 0
          ? targets.reduce((sum, t) => sum + (parseFloat(t.fy_target) || 0), 0) / targets.length
          : 0,
      avgResult:
        entries.length > 0
          ? entries.reduce((sum, e) => sum + (parseFloat(e.result) || 0), 0) / entries.length
          : 0,
    };
  });

  return (
    <div className="space-y-4">
      <Tabs value={dashboardTab} onValueChange={setDashboardTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Targets</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Results</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categoryData.map((cat) => (
              <Card key={cat.category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{cat.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Targets:</span>
                      <span className="font-medium">{cat.targetCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Entries:</span>
                      <span className="font-medium">{cat.entryCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Target:</span>
                      <span className="font-medium">{cat.avgTarget.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Result:</span>
                      <span className="font-medium">{cat.avgResult.toFixed(1)}</span>
                    </div>
                    {cat.avgTarget > 0 && (
                      <Progress
                        value={Math.min((cat.avgResult / cat.avgTarget) * 100, 100)}
                        className="h-2 mt-2"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Yearly Targets Tab */}
        <TabsContent value="yearly">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Targets - FY{selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Key Action</TableHead>
                    <TableHead>PIC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearlyTargets
                    .filter((t) => t.metric_name)
                    .map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge variant="outline">{row.category}</Badge>
                        </TableCell>
                        <TableCell>{row.metric_name}</TableCell>
                        <TableCell>{row.unit}</TableCell>
                        <TableCell className="font-medium">{row.fy_target}</TableCell>
                        <TableCell className="max-w-xs truncate">{row.policy}</TableCell>
                        <TableCell className="max-w-xs truncate">{row.key_action}</TableCell>
                        <TableCell>{row.responsible_person}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Results Tab */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Results - FY{selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Achievement</TableHead>
                    <TableHead>EV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyEntries
                    .filter((m) => m.metric_name)
                    .map((row, i) => {
                      const achievement =
                        parseFloat(row.target) > 0
                          ? ((parseFloat(row.result) / parseFloat(row.target)) * 100).toFixed(1)
                          : '-';
                      return (
                        <TableRow key={i}>
                          <TableCell>
                            <Badge variant="outline">{row.category}</Badge>
                          </TableCell>
                          <TableCell>{row.metric_name}</TableCell>
                          <TableCell>{MONTHS[row.month - 1]}</TableCell>
                          <TableCell>{row.target}</TableCell>
                          <TableCell className="font-medium">{row.result}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                parseFloat(achievement) >= 95
                                  ? 'default'
                                  : parseFloat(achievement) >= 80
                                    ? 'secondary'
                                    : 'destructive'
                              }>
                              {achievement}%
                            </Badge>
                          </TableCell>
                          <TableCell>{row.ev}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gantt Chart Tab */}
        <TabsContent value="gantt">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GanttChart className="h-5 w-5" />
                Action Plans Progress - FY{selectedYear}
              </CardTitle>
              <CardDescription>Track action plan progress throughout the year</CardDescription>
            </CardHeader>
            <CardContent>
              <GanttChartView actionPlans={actionPlans} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Gantt Chart Component
function GanttChartView({ actionPlans }: { actionPlans: ActionPlan[] }) {
  const validPlans = actionPlans.filter((a) => a.key_action);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-blue-500';
      case 'Delayed':
        return 'bg-red-500';
      case 'Cancelled':
        return 'bg-gray-400';
      default:
        return 'bg-gray-300';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span>Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span>Delayed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-400"></div>
          <span>Cancelled</span>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Month Headers */}
          <div className="grid grid-cols-[1fr_repeat(12,60px)] gap-1 mb-2">
            <div className="font-medium text-sm p-2">Action Plan</div>
            {MONTHS.map((m) => (
              <div key={m} className="text-center text-xs font-medium p-2 border-b">
                {m}
              </div>
            ))}
          </div>

          {/* Action Plan Rows */}
          {validPlans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No action plans to display</div>
          ) : (
            validPlans.map((plan, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_repeat(12,60px)] gap-1 border-b py-2">
                {/* Action Name */}
                <div className="p-2">
                  <div className="text-sm font-medium truncate" title={plan.key_action}>
                    {plan.key_action}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(plan.status)} text-white border-0`}>
                      {plan.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{plan.progress}%</span>
                  </div>
                </div>

                {/* Month Cells */}
                {Array.from({ length: 12 }, (_, monthIdx) => {
                  const month = monthIdx + 1;
                  const isActive = month >= plan.start_month && month <= plan.end_month;
                  const isCurrentMonth = month === new Date().getMonth() + 1;

                  return (
                    <div
                      key={month}
                      className={`h-10 border-l relative ${isCurrentMonth ? 'bg-blue-50' : ''}`}>
                      {isActive && (
                        <div
                          className={`absolute top-1 bottom-1 left-1 right-1 rounded ${
                            plan.status === 'Completed'
                              ? 'bg-green-200'
                              : plan.status === 'Delayed'
                                ? 'bg-red-200'
                                : month < new Date().getMonth() + 1
                                  ? `${getProgressColor(plan.progress)} opacity-60`
                                  : 'bg-gray-200'
                          }`}
                          title={`${plan.key_action}: ${MONTHS[plan.start_month - 1]} - ${MONTHS[plan.end_month - 1]}`}>
                          {month === plan.start_month && (
                            <div className="h-full flex items-center justify-center">
                              <ChevronRight className="h-3 w-3 text-gray-600" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid gap-4 md:grid-cols-3 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validPlans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {validPlans.filter((p) => p.status === 'Completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Average Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {validPlans.length > 0
                ? Math.round(validPlans.reduce((sum, p) => sum + p.progress, 0) / validPlans.length)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
