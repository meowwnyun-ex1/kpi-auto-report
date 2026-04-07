import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  GanttChart,
  Save,
  Loader2,
  Plus,
  Trash2,
  ChevronRight,
} from 'lucide-react';

interface Department {
  dept_id: string;
  name_en: string;
}

interface ActionPlan {
  id?: number;
  key_action: string;
  action_plan: string;
  person_in_charge: string;
  start_month: number;
  end_month: number;
  status: string;
  progress: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_OPTIONS = ['Planned', 'In Progress', 'Completed', 'Delayed', 'Cancelled'];

export default function ActionPlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);

  const canEdit = user?.role && ['manager', 'admin', 'superadmin'].includes(user.role);

  useEffect(() => {
    fetchDepartments();
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
      const res = await fetch(`/api/kpi-forms/action-plans/${selectedDept}/${selectedYear}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
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
    key_action: '',
    action_plan: '',
    person_in_charge: '',
    start_month: 1,
    end_month: 12,
    status: 'Planned',
    progress: 0,
  });

  const addPlan = () => setActionPlans([...actionPlans, createEmptyPlan()]);
  const removePlan = (index: number) => setActionPlans(actionPlans.filter((_, i) => i !== index));
  const updatePlan = (index: number, field: keyof ActionPlan, value: string | number) => {
    const updated = [...actionPlans];
    updated[index][field] = value as never;
    setActionPlans(updated);
  };

  const saveData = async () => {
    if (!canEdit) {
      toast({ title: 'Error', description: 'No permission to edit', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/kpi-forms/action-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          department_id: selectedDept,
          fiscal_year: selectedYear,
          plans: actionPlans.filter(p => p.key_action),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Action plans saved successfully' });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Delayed': return 'bg-red-500';
      case 'Cancelled': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const validPlans = actionPlans.filter(p => p.key_action);

  return (
    <ShellLayout variant="sidebar">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Action Plans</h1>
            <p className="text-muted-foreground">Track action plans with Gantt chart</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.dept_id} value={d.dept_id}>{d.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
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

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Form */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>FY{selectedYear} Action Plans - {departments.find(d => d.dept_id === selectedDept)?.name_en || selectedDept}</CardTitle>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={addPlan}>
                      <Plus className="h-4 w-4 mr-1" /> Add Row
                    </Button>
                    <Button size="sm" onClick={saveData} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
                        <TableHead className="w-28">PIC</TableHead>
                        <TableHead className="w-20">Start</TableHead>
                        <TableHead className="w-20">End</TableHead>
                        <TableHead className="w-28">Status</TableHead>
                        <TableHead className="w-32">Progress</TableHead>
                        {canEdit && <TableHead className="w-16"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actionPlans.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Input value={row.key_action} onChange={(e) => updatePlan(i, 'key_action', e.target.value)} disabled={!canEdit} className="border-0 bg-transparent" />
                          </TableCell>
                          <TableCell>
                            <Input value={row.action_plan} onChange={(e) => updatePlan(i, 'action_plan', e.target.value)} disabled={!canEdit} className="border-0 bg-transparent" />
                          </TableCell>
                          <TableCell>
                            <Input value={row.person_in_charge} onChange={(e) => updatePlan(i, 'person_in_charge', e.target.value)} disabled={!canEdit} className="border-0 bg-transparent" />
                          </TableCell>
                          <TableCell>
                            <Select value={row.start_month.toString()} onValueChange={(v) => updatePlan(i, 'start_month', parseInt(v))} disabled={!canEdit}>
                              <SelectTrigger className="border-0 bg-transparent w-16">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {MONTHS.map((m, idx) => (
                                  <SelectItem key={idx} value={(idx + 1).toString()}>{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select value={row.end_month.toString()} onValueChange={(v) => updatePlan(i, 'end_month', parseInt(v))} disabled={!canEdit}>
                              <SelectTrigger className="border-0 bg-transparent w-16">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {MONTHS.map((m, idx) => (
                                  <SelectItem key={idx} value={(idx + 1).toString()}>{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select value={row.status} onValueChange={(v) => updatePlan(i, 'status', v)} disabled={!canEdit}>
                              <SelectTrigger className="border-0 bg-transparent w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div className={`${getProgressColor(row.progress)} h-2 rounded-full`} style={{ width: `${row.progress}%` }} />
                              </div>
                              <Input 
                                type="number" 
                                min="0" 
                                max="100"
                                value={row.progress} 
                                onChange={(e) => updatePlan(i, 'progress', parseInt(e.target.value) || 0)} 
                                disabled={!canEdit} 
                                className="border-0 bg-transparent w-12 text-xs" 
                              />
                              <span className="text-xs">%</span>
                            </div>
                          </TableCell>
                          {canEdit && (
                            <TableCell>
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
              </CardContent>
            </Card>

            {/* Gantt Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GanttChart className="h-5 w-5" />
                  Gantt Chart View
                </CardTitle>
                <CardDescription>Visual timeline of action plans</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-sm mb-4">
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
                      <div className="text-center py-8 text-muted-foreground">
                        No action plans to display
                      </div>
                    ) : (
                      validPlans.map((plan, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_repeat(12,60px)] gap-1 border-b py-2">
                          {/* Action Name */}
                          <div className="p-2">
                            <div className="text-sm font-medium truncate" title={plan.key_action}>
                              {plan.key_action}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={`text-xs ${getStatusColor(plan.status)} text-white border-0`}>
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
                                className={`h-10 border-l relative ${isCurrentMonth ? 'bg-blue-50' : ''}`}
                              >
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
                                    title={`${plan.key_action}: ${MONTHS[plan.start_month - 1]} - ${MONTHS[plan.end_month - 1]}`}
                                  >
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

                {/* Summary */}
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
                        {validPlans.filter(p => p.status === 'Completed').length}
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
                          : 0}%
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ShellLayout>
  );
}
