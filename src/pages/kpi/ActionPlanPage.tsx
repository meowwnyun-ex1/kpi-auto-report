import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DepartmentService, { type Department } from '@/services/department-service';
import KpiFormsService, { type ActionPlan } from '@/services/kpi-forms-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Calendar,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const statusConfig: Record<
  string,
  { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  Planned: { color: 'bg-gray-100 text-gray-800', icon: Clock },
  'In Progress': { color: 'bg-blue-100 text-blue-800', icon: Play },
  Completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  Delayed: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export const ActionPlanPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [expandedPlans, setExpandedPlans] = useState<Set<number>>(new Set());

  const canEdit = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'manager';

  // Load departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const result = await DepartmentService.getDepartments();
        if (result.success) {
          setDepartments(result.data);
          if (user?.role === 'manager' && user.department_id) {
            setDepartments(result.data.filter((d) => d.dept_id === user.department_id));
          }
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepartments();
  }, [user]);

  // Load action plans
  useEffect(() => {
    const fetchPlans = async () => {
      if (!selectedDepartment) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await KpiFormsService.getActionPlans(selectedDepartment, selectedYear);
        if (result.success) {
          setActionPlans(result.data);
        }
      } catch (err) {
        console.error('Failed to load action plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [selectedDepartment, selectedYear]);

  const togglePlan = (id: number) => {
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPlans(newExpanded);
  };

  const updatePlan = (id: number, field: keyof ActionPlan, value: string | number | null) => {
    setActionPlans(actionPlans.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const addNewPlan = () => {
    const newPlan: ActionPlan = {
      id: 0, // Temporary ID for new plan
      department_id: selectedDepartment,
      yearly_target_id: null,
      fiscal_year: selectedYear,
      key_action: '',
      action_plan: '',
      action_detail: '',
      target_of_action: '',
      result_of_action: '',
      person_in_charge: '',
      start_month: 1,
      end_month: 12,
      lead_time_months: 12,
      actual_start_date: null,
      actual_end_date: null,
      actual_kickoff: null,
      status: 'Planned',
      progress_percent: 0,
      pdca_stage: null,
      pdca_notes: null,
      jan_status: null,
      feb_status: null,
      mar_status: null,
      apr_status: null,
      may_status: null,
      jun_status: null,
      jul_status: null,
      aug_status: null,
      sep_status: null,
      oct_status: null,
      nov_status: null,
      dec_status: null,
      sort_order: actionPlans.length,
      department_name: '',
    };
    setActionPlans([...actionPlans, newPlan]);
    setExpandedPlans(new Set([...expandedPlans, 0]));
  };

  const savePlan = async (plan: ActionPlan) => {
    setSaving(true);
    try {
      const result = await KpiFormsService.saveActionPlan(plan);
      if (result.success && result.data.id && plan.id === 0) {
        // Update with real ID
        setActionPlans(actionPlans.map((p) => (p === plan ? { ...p, id: result.data.id } : p)));
      }
      toast({ title: 'Saved successfully' });
    } catch (err) {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id: number) => {
    if (id === 0) {
      // Remove unsaved plan
      setActionPlans(actionPlans.filter((p) => p.id !== id));
      return;
    }

    try {
      await KpiFormsService.deleteActionPlan(id);
      setActionPlans(actionPlans.filter((p) => p.id !== id));
      toast({ title: 'Deleted successfully' });
    } catch (err) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  // Render Gantt bar
  const renderGanttBar = (plan: ActionPlan) => {
    const start = plan.start_month || 1;
    const end = plan.end_month || 12;
    const width = ((end - start + 1) / 12) * 100;
    const left = ((start - 1) / 12) * 100;

    const statusColor = {
      Planned: 'bg-gray-400',
      'In Progress': 'bg-blue-500',
      Completed: 'bg-green-500',
      Delayed: 'bg-red-500',
    };

    return (
      <div className="relative h-6 bg-gray-100 rounded">
        <div
          className={`absolute h-full rounded ${statusColor[plan.status] || 'bg-gray-400'}`}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        {/* Month markers */}
        <div className="absolute inset-0 flex">
          {months.map((_, i) => (
            <div key={i} className="flex-1 border-r border-gray-200 last:border-r-0" />
          ))}
        </div>
      </div>
    );
  };

  return (
    <ShellLayout variant="user">
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Action Plan (Page 4)</h1>
            <p className="text-gray-500">
              Gantt Chart - Track action plans and progress throughout the year
            </p>
          </div>
          {canEdit && selectedDepartment && (
            <Button onClick={addNewPlan} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Action Plan
            </Button>
          )}
        </div>

        {/* Department & Year Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Department & Fiscal Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Department
                </Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.dept_id} value={dept.dept_id}>
                        {dept.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        FY{y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && selectedDepartment && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        )}

        {/* No Department Selected */}
        {!selectedDepartment && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">Select a Department</h3>
              <p className="text-gray-500">
                Please select a department to view and manage action plans
              </p>
            </CardContent>
          </Card>
        )}

        {/* Gantt Chart Overview */}
        {!loading && selectedDepartment && actionPlans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gantt Chart Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 border text-left min-w-[200px]">Key Action</th>
                      <th className="p-2 border text-center w-24">Status</th>
                      <th className="p-2 border text-center w-16">%</th>
                      <th className="p-2 border text-left min-w-[500px]">
                        Timeline (FY{selectedYear})
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionPlans.map((plan) => {
                      const StatusIcon = statusConfig[plan.status]?.icon || Clock;
                      return (
                        <tr
                          key={plan.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => togglePlan(plan.id)}>
                          <td className="p-2 border">
                            <div className="flex items-center gap-2">
                              {expandedPlans.has(plan.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span className="font-medium">{plan.key_action || 'New Action'}</span>
                            </div>
                          </td>
                          <td className="p-2 border text-center">
                            <Badge className={statusConfig[plan.status]?.color || ''}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {plan.status}
                            </Badge>
                          </td>
                          <td className="p-2 border text-center">
                            <span className="font-medium">{plan.progress_percent}%</span>
                          </td>
                          <td className="p-2 border">{renderGanttBar(plan)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Plan Details */}
        {!loading && selectedDepartment && actionPlans.length > 0 && (
          <div className="space-y-4">
            {actionPlans.map((plan) => {
              if (!expandedPlans.has(plan.id)) return null;

              return (
                <Card key={plan.id} className="overflow-hidden">
                  <div className="p-4 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold">{plan.key_action || 'New Action Plan'}</h3>
                    <div className="flex gap-2">
                      {canEdit && (
                        <>
                          <Button size="sm" onClick={() => savePlan(plan)} disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePlan(plan.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Key Action</Label>
                          <Input
                            value={plan.key_action}
                            onChange={(e) => updatePlan(plan.id, 'key_action', e.target.value)}
                            placeholder="Enter key action..."
                            disabled={!canEdit}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Action Plan</Label>
                          <Textarea
                            value={plan.action_plan || ''}
                            onChange={(e) => updatePlan(plan.id, 'action_plan', e.target.value)}
                            placeholder="Detailed action plan..."
                            rows={3}
                            disabled={!canEdit}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Target of Action</Label>
                          <Input
                            value={plan.target_of_action || ''}
                            onChange={(e) =>
                              updatePlan(plan.id, 'target_of_action', e.target.value)
                            }
                            placeholder="Expected outcome..."
                            disabled={!canEdit}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Result of Action</Label>
                          <Input
                            value={plan.result_of_action || ''}
                            onChange={(e) =>
                              updatePlan(plan.id, 'result_of_action', e.target.value)
                            }
                            placeholder="Actual result..."
                            disabled={!canEdit}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Person in Charge</Label>
                            <Input
                              value={plan.person_in_charge || ''}
                              onChange={(e) =>
                                updatePlan(plan.id, 'person_in_charge', e.target.value)
                              }
                              placeholder="PIC name"
                              disabled={!canEdit}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                              value={plan.status}
                              onValueChange={(v) => updatePlan(plan.id, 'status', v as any)}>
                              <SelectTrigger disabled={!canEdit}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Planned">Planned</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Delayed">Delayed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Start Month</Label>
                            <Select
                              value={plan.start_month?.toString() || '1'}
                              onValueChange={(v) =>
                                updatePlan(plan.id, 'start_month', parseInt(v))
                              }>
                              <SelectTrigger disabled={!canEdit}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {months.map((m, i) => (
                                  <SelectItem key={m} value={(i + 1).toString()}>
                                    {m}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>End Month</Label>
                            <Select
                              value={plan.end_month?.toString() || '12'}
                              onValueChange={(v) => updatePlan(plan.id, 'end_month', parseInt(v))}>
                              <SelectTrigger disabled={!canEdit}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {months.map((m, i) => (
                                  <SelectItem key={m} value={(i + 1).toString()}>
                                    {m}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Progress %</Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={plan.progress_percent}
                              onChange={(e) =>
                                updatePlan(
                                  plan.id,
                                  'progress_percent',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              disabled={!canEdit}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>PDCA Stage</Label>
                          <div className="flex gap-2">
                            {['P', 'D', 'C', 'A'].map((stage) => (
                              <Button
                                key={stage}
                                variant={plan.pdca_stage === stage ? 'default' : 'outline'}
                                size="sm"
                                onClick={() =>
                                  canEdit && updatePlan(plan.id, 'pdca_stage', stage as any)
                                }
                                disabled={!canEdit}>
                                {stage}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>PDCA Notes</Label>
                          <Textarea
                            value={plan.pdca_notes || ''}
                            onChange={(e) => updatePlan(plan.id, 'pdca_notes', e.target.value)}
                            placeholder="Notes for PDCA cycle..."
                            rows={2}
                            disabled={!canEdit}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Monthly Status Tracking */}
                    <div className="mt-4 pt-4 border-t">
                      <Label className="mb-2 block">Monthly Status</Label>
                      <div className="flex gap-2">
                        {months.map((m, i) => {
                          const monthKey = `${m.toLowerCase()}_status` as keyof ActionPlan;
                          const status = plan[monthKey] as string | null;
                          return (
                            <div key={m} className="flex-1 text-center">
                              <div className="text-xs text-gray-500 mb-1">{m}</div>
                              <Select
                                value={status || ''}
                                onValueChange={(v) => updatePlan(plan.id, monthKey, v || null)}>
                                <SelectTrigger className="h-8 text-xs" disabled={!canEdit}>
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">-</SelectItem>
                                  <SelectItem value="G">G</SelectItem>
                                  <SelectItem value="Y">Y</SelectItem>
                                  <SelectItem value="R">R</SelectItem>
                                  <SelectItem value="D">Done</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* No Data */}
        {!loading && selectedDepartment && actionPlans.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No Action Plans</h3>
              <p className="text-gray-500 mb-4">
                No action plans found for this department in FY{selectedYear}
              </p>
              {canEdit && (
                <Button onClick={addNewPlan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Action Plan
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ShellLayout>
  );
};

export default ActionPlanPage;
