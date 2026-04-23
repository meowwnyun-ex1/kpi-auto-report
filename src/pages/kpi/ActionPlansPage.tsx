import React, { useState, useEffect, useMemo } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/shared/utils';
import { TOAST_MESSAGES } from '@/shared/constants';
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
import { DepartmentSelector } from '@/components/kpi/DepartmentSelector';
import {
  Shield,
  Award,
  Truck,
  FileCheck,
  Users,
  Star,
  Leaf,
  DollarSign,
  Calendar,
  Save,
  Loader2,
  Plus,
  Trash2,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  GanttChart,
  RefreshCw,
} from 'lucide-react';
import { TableContainer, TABLE_STYLES } from '@/components/shared/TableContainer';

// ============================================
// TYPES
// ============================================

interface Category {
  id: number;
  name: string;
  key: string;
  color: string;
}

interface Department {
  dept_id: string;
  name_en: string;
  company: string | null;
}

interface ActionPlan {
  id?: number;
  category_id: number;
  key_action: string;
  action_plan: string;
  person_in_charge: string;
  start_month: number;
  end_month: number;
  status: string;
  progress: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// CONSTANTS
// ============================================

const MONTHS = [
  { value: 1, label: 'Jan', labelTh: 'à¸¡.à¸.' },
  { value: 2, label: 'Feb', labelTh: 'à¸.à¸.' },
  { value: 3, label: 'Mar', labelTh: 'à¸¡.à¸µ.' },
  { value: 4, label: 'Apr', labelTh: 'à¹à¸¡.à¸¢.' },
  { value: 5, label: 'May', labelTh: 'à¸.à¸.' },
  { value: 6, label: 'Jun', labelTh: 'à¸¡.à¸´.' },
  { value: 7, label: 'Jul', labelTh: 'à¸.à¸.' },
  { value: 8, label: 'Aug', labelTh: 'à¸ª.à¸.' },
  { value: 9, label: 'Sep', labelTh: 'à¸.à¸¢.' },
  { value: 10, label: 'Oct', labelTh: 'à¸.à¸.' },
  { value: 11, label: 'Nov', labelTh: 'à¸.à¸¢.' },
  { value: 12, label: 'Dec', labelTh: 'à¸.à¸.' },
];

const STATUS_OPTIONS = [
  { value: 'Planned', color: 'bg-gray-500' },
  { value: 'In Progress', color: 'bg-blue-500' },
  { value: 'Completed', color: 'bg-green-500' },
  { value: 'Delayed', color: 'bg-red-500' },
  { value: 'Cancelled', color: 'bg-gray-400' },
];

const CATEGORY_CONFIG: Record<
  string,
  { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  safety: { color: '#DC2626', icon: Shield },
  quality: { color: '#16A34A', icon: Award },
  delivery: { color: '#2563EB', icon: Truck },
  compliance: { color: '#9333EA', icon: FileCheck },
  hr: { color: '#EA580C', icon: Users },
  attractive: { color: '#DB2777', icon: Star },
  environment: { color: '#0D9488', icon: Leaf },
  cost: { color: '#4F46E5', icon: DollarSign },
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function ActionPlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Step 1: Category selection
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Step 2: Department selection
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');

  // Step 3: Year selection
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Data
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [employees, setEmployees] = useState<
    { employee_id: string; name_en: string; name_th?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Permission
  const canEdit = user?.role && ['manager', 'admin', 'superadmin'].includes(user.role);

  // Fetch employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/admin/employees?limit=200', {
          headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
        });
        const data = await response.json();
        if (data.success) setEmployees(data.data);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  // Check if form is ready
  const isFormReady = selectedCategory && selectedDept && selectedYear;

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    fetchDepartments();
  }, []);

  // Fetch data when all selections are made
  useEffect(() => {
    if (isFormReady) {
      fetchData();
    }
  }, [selectedCategory, selectedDept, selectedYear]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/kpi-forms/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(
          data.data.map((c: any) => ({
            ...c,
            color: CATEGORY_CONFIG[c.key]?.color || '#6B7280',
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data);
        // Don't auto-select - let user select via DepartmentSelector
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/kpi-forms/action-plans/${selectedDept}/${selectedYear}?category=${selectedCategory}`,
        { headers: { Authorization: `Bearer ${storage.getAuthToken()}` } }
      );
      const data = await res.json();
      if (data.success) {
        setActionPlans(data.data.length > 0 ? data.data : [createEmptyPlan()]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmptyPlan = (): ActionPlan => ({
    category_id: categories.find((c) => c.key === selectedCategory)?.id || 0,
    key_action: '',
    action_plan: '',
    person_in_charge: '',
    start_month: 1,
    end_month: 12,
    status: 'Planned',
    progress: 0,
  });

  const addPlan = () => setActionPlans([...actionPlans, createEmptyPlan()]);

  const removePlan = (index: number) => {
    setActionPlans(actionPlans.filter((_, i) => i !== index));
  };

  const updatePlan = (index: number, field: keyof ActionPlan, value: string | number) => {
    const updated = [...actionPlans];
    updated[index][field] = value as never;
    setActionPlans(updated);
  };

  const saveData = async () => {
    if (!canEdit) {
      toast({
        title: 'Access Denied',
        description: TOAST_MESSAGES.ACCESS_DENIED,
        variant: 'destructive',
      });
      return;
    }

    const validPlans = actionPlans.filter((p) => p.key_action);
    if (validPlans.length === 0) {
      toast({
        title: 'No Data to Save',
        description: 'Please enter at least one complete action plan before saving.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/kpi-forms/action-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify({
          department_id: selectedDept,
          category_id: categories.find((c) => c.key === selectedCategory)?.id,
          fiscal_year: selectedYear,
          plans: validPlans,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Action Plans Saved',
          description: 'All action plans have been saved successfully.',
        });
        fetchData();
      } else {
        toast({
          title: 'Save Failed',
          description: data.message || TOAST_MESSAGES.SAVE_FAILED,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: TOAST_MESSAGES.CONNECTION_ERROR,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || 'bg-gray-300';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Get category config
  const categoryConfig = selectedCategory ? CATEGORY_CONFIG[selectedCategory] : null;
  const CategoryIcon = categoryConfig?.icon || Shield;

  // Calculate stats
  const validPlans = actionPlans.filter((p) => p.key_action);
  const completedCount = validPlans.filter((p) => p.status === 'Completed').length;
  const avgProgress =
    validPlans.length > 0
      ? Math.round(validPlans.reduce((sum, p) => sum + p.progress, 0) / validPlans.length)
      : 0;

  const savedPlans = useMemo(() => {
    const baseSaved = actionPlans.filter((p) => p.id);
    if (!searchQuery.trim()) {
      return baseSaved;
    }
    const query = searchQuery.toLowerCase();
    return baseSaved.filter(
      (plan) =>
        plan.key_action?.toLowerCase().includes(query) ||
        plan.action_plan?.toLowerCase().includes(query) ||
        plan.person_in_charge?.toLowerCase().includes(query) ||
        plan.status?.toLowerCase().includes(query)
    );
  }, [actionPlans, searchQuery]);

  return (
    <ShellLayout variant="admin">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {categoryConfig && (
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${categoryConfig.color}20` }}>
                <CategoryIcon className="h-6 w-6" style={{ color: categoryConfig.color }} />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">Action Plans</h1>
            </div>
          </div>

          {/* Stats */}
          {isFormReady && validPlans.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{validPlans.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{avgProgress}%</div>
                <div className="text-xs text-muted-foreground">Avg Progress</div>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1"
            onClick={() => fetchData()}
            disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Step 1: Select Category */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                1
              </span>
              Select KPI Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {categories.map((cat) => {
                const config = CATEGORY_CONFIG[cat.key] || { color: '#6B7280', icon: Shield };
                const Icon = config.icon;
                const isSelected = selectedCategory === cat.key;

                return (
                  <Button
                    key={cat.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`h-auto py-3 flex flex-col items-center gap-1 ${isSelected ? 'ring-2 ring-offset-2' : ''}`}
                    style={isSelected ? { backgroundColor: config.color } : {}}
                    onClick={() => {
                      setSelectedCategory(cat.key);
                      setSelectedDept(''); // Reset department when category changes
                      setActionPlans([]);
                    }}>
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{cat.name}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Department & Year */}
        {selectedCategory && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                  2
                </span>
                Select Department & Fiscal Year
              </CardTitle>
              <CardDescription>Choose department and fiscal year for action plans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-2">
                  <DepartmentSelector
                    value={selectedDept}
                    onChange={setSelectedDept}
                    label="Department"
                    placeholder="Select department"
                    showKpiOnly={true}
                    restrictToUserDept={true}
                  />
                </div>

                {/* Year */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fiscal Year
                  </Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">FY2024</SelectItem>
                      <SelectItem value="2025">FY2025</SelectItem>
                      <SelectItem value="2026">FY2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* FY Info */}
              {selectedDept && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>FY{selectedYear}:</strong> April {selectedYear} - March{' '}
                    {selectedYear + 1}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Data Entry Form */}
        {isFormReady && (
          <TableContainer
            icon={CategoryIcon}
            title="Enter Action Plans"
            subtitle={`${departments.find((d) => d.dept_id === selectedDept)?.name_en} - FY${selectedYear}`}
            badge={`${validPlans.length} plans`}
            totalCount={validPlans.length}
            theme="blue"
            iconColor={categoryConfig?.color}
            actions={
              canEdit && (
                <Button size="sm" onClick={saveData} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              )
            }>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 sticky top-0 z-10">
                    <TableRow className={TABLE_STYLES.headerRow}>
                      <TableHead
                        className={`min-w-[150px] bg-blue-50 ${TABLE_STYLES.headerCell} pl-6`}>
                        <span className="font-medium">Key Action</span>
                      </TableHead>
                      <TableHead className={`min-w-[150px] bg-blue-50 ${TABLE_STYLES.headerCell}`}>
                        <span className="font-medium">Action Plan</span>
                      </TableHead>
                      <TableHead
                        className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[80px]`}>
                        <span className="font-medium">PIC</span>
                      </TableHead>
                      <TableHead
                        className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[60px]`}>
                        <span className="font-medium">Start</span>
                      </TableHead>
                      <TableHead
                        className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[60px]`}>
                        <span className="font-medium">End</span>
                      </TableHead>
                      <TableHead
                        className={`text-center bg-purple-50 ${TABLE_STYLES.headerCell} min-w-[100px]`}>
                        <span className="font-medium">Status</span>
                      </TableHead>
                      <TableHead
                        className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[100px]`}>
                        <span className="font-medium">Progress</span>
                      </TableHead>
                      {canEdit && (
                        <TableHead className={`w-12 bg-blue-50 ${TABLE_STYLES.headerCell} pr-6`} />
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actionPlans.map((row, i) => (
                      <TableRow key={i} className={`${TABLE_STYLES.dataRow} hover:bg-blue-50/30`}>
                        <TableCell className="py-4 bg-white">
                          <Input
                            value={row.key_action}
                            onChange={(e) => updatePlan(i, 'key_action', e.target.value)}
                            disabled={!canEdit}
                            className="h-8"
                            placeholder="Key action..."
                          />
                        </TableCell>
                        <TableCell className="py-4 bg-gray-50/30">
                          <Input
                            value={row.action_plan}
                            onChange={(e) => updatePlan(i, 'action_plan', e.target.value)}
                            disabled={!canEdit}
                            className="h-8"
                            placeholder="Action plan..."
                          />
                        </TableCell>
                        <TableCell className="text-center py-4 bg-white">
                          <Select
                            value={row.person_in_charge}
                            onValueChange={(v) => updatePlan(i, 'person_in_charge', v)}
                            disabled={!canEdit}>
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">-</SelectItem>
                              {employees.map((emp) => (
                                <SelectItem key={emp.employee_id} value={emp.employee_id}>
                                  {emp.name_en}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center py-4 bg-gray-50/30">
                          <Select
                            value={row.start_month.toString()}
                            onValueChange={(v) => updatePlan(i, 'start_month', parseInt(v))}
                            disabled={!canEdit}>
                            <SelectTrigger className="h-8 w-16">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map((m) => (
                                <SelectItem key={m.value} value={m.value.toString()}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center py-4 bg-white">
                          <Select
                            value={row.end_month.toString()}
                            onValueChange={(v) => updatePlan(i, 'end_month', parseInt(v))}
                            disabled={!canEdit}>
                            <SelectTrigger className="h-8 w-16">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map((m) => (
                                <SelectItem key={m.value} value={m.value.toString()}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center py-4 bg-gray-50/30">
                          <Select
                            value={row.status}
                            onValueChange={(v) => updatePlan(i, 'status', v)}
                            disabled={!canEdit}>
                            <SelectTrigger className="h-8 w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-4 bg-white">
                          <div className="flex items-center gap-2">
                            <Progress value={row.progress} className="flex-1 h-2" />
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={row.progress}
                              onChange={(e) =>
                                updatePlan(i, 'progress', parseInt(e.target.value) || 0)
                              }
                              disabled={!canEdit}
                              className="h-8 w-12"
                            />
                            <span className="text-xs">%</span>
                          </div>
                        </TableCell>
                        {canEdit && (
                          <TableCell className={`${TABLE_STYLES.actionCell} bg-gray-50/30`}>
                            <Button size="sm" variant="ghost" onClick={() => removePlan(i)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TableContainer>
        )}

        {/* Gantt Chart */}
        {isFormReady && validPlans.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GanttChart className="h-5 w-5" />
                Gantt Chart View
              </CardTitle>
              <CardDescription>Visual timeline of action plans</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs mb-4">
                {STATUS_OPTIONS.map((s) => (
                  <div key={s.value} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded ${s.color}`} />
                    <span>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Gantt Chart */}
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Month Headers */}
                  <div className="grid grid-cols-[1fr_repeat(12,50px)] gap-1 mb-2">
                    <div className="font-medium text-xs p-2">Action Plan</div>
                    {MONTHS.map((m) => (
                      <div key={m.value} className="text-center text-xs font-medium p-2 border-b">
                        {m.label}
                      </div>
                    ))}
                  </div>

                  {/* Action Plan Rows */}
                  {validPlans.map((plan, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_repeat(12,50px)] gap-1 border-b py-2">
                      {/* Action Name */}
                      <div className="p-2">
                        <div className="text-xs font-medium truncate" title={plan.key_action}>
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
                            className={`h-8 border-l relative ${isCurrentMonth ? 'bg-blue-50' : ''}`}>
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
                                title={`${plan.key_action}: ${MONTHS[plan.start_month - 1].label} - ${MONTHS[plan.end_month - 1].label}`}>
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
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Previously Entered Data */}
        {isFormReady && savedPlans.length > 0 && (
          <TableContainer
            icon={CategoryIcon}
            title="Previously Saved Plans"
            subtitle="Historical action plans for this category"
            badge={`${savedPlans.length} plans`}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by key action, action plan, PIC, or status..."
            theme="purple"
            actions={
              <Button size="sm" variant="outline" onClick={addPlan}>
                <Plus className="h-4 w-4 mr-1" /> Add Row
              </Button>
            }>
            <div className="overflow-x-auto max-h-[300px]">
              <Table className="text-xs">
                <TableHeader className="bg-gradient-to-r from-purple-50 to-violet-100 sticky top-0 z-10">
                  <TableRow className={TABLE_STYLES.headerRow}>
                    <TableHead className={`w-12 bg-purple-50 ${TABLE_STYLES.headerCell} pl-6`}>
                      #
                    </TableHead>
                    <TableHead className={`min-w-[150px] bg-purple-50 ${TABLE_STYLES.headerCell}`}>
                      Key Action
                    </TableHead>
                    <TableHead className={`min-w-[150px] bg-purple-50 ${TABLE_STYLES.headerCell}`}>
                      Action Plan
                    </TableHead>
                    <TableHead
                      className={`text-center bg-purple-50 ${TABLE_STYLES.headerCell} min-w-[80px]`}>
                      PIC
                    </TableHead>
                    <TableHead
                      className={`text-center bg-purple-50 ${TABLE_STYLES.headerCell} min-w-[100px]`}>
                      Period
                    </TableHead>
                    <TableHead
                      className={`text-center bg-purple-50 ${TABLE_STYLES.headerCell} min-w-[100px]`}>
                      Status
                    </TableHead>
                    <TableHead
                      className={`text-center bg-purple-50 ${TABLE_STYLES.headerCell} min-w-[100px]`}>
                      Progress
                    </TableHead>
                    <TableHead
                      className={`min-w-[120px] bg-purple-50 ${TABLE_STYLES.headerCell} pr-6`}>
                      Updated
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedPlans
                    .sort(
                      (a, b) =>
                        new Date(b.updated_at ?? 0).getTime() -
                        new Date(a.updated_at ?? 0).getTime()
                    )
                    .map((plan, idx) => (
                      <TableRow
                        key={idx}
                        className={`${TABLE_STYLES.dataRow} hover:bg-purple-50/30`}>
                        <TableCell className={`${TABLE_STYLES.rowNumber} bg-purple-50/50`}>
                          {idx + 1}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate py-4 bg-white">
                          {plan.key_action}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate py-4 bg-gray-50/30">
                          {plan.action_plan || '-'}
                        </TableCell>
                        <TableCell className="text-center py-4 bg-white">
                          {plan.person_in_charge || '-'}
                        </TableCell>
                        <TableCell className="text-center py-4 bg-gray-50/30">
                          {MONTHS[plan.start_month - 1]?.label} -{' '}
                          {MONTHS[plan.end_month - 1]?.label}
                        </TableCell>
                        <TableCell className="text-center py-4 bg-white">
                          <Badge className={`${getStatusColor(plan.status)} text-white border-0`}>
                            {plan.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-4 bg-gray-50/30">
                          {plan.progress}%
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground py-4 bg-white">
                          {plan.updated_at ? new Date(plan.updated_at).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </TableContainer>
        )}

        {/* Instructions */}
        {!selectedCategory && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a KPI Category to Begin</h3>
              <p className="text-muted-foreground">
                Choose a category, then select department and fiscal year to enter action plans
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ShellLayout>
  );
}
