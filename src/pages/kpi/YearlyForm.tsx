import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { UnifiedError } from '@/components/ui/unified-error';
import { useAuth } from '@/contexts/AuthContext';
import DepartmentService, { type Department } from '@/services/department-service';
import KpiFormsService, { type YearlyTarget } from '@/services/kpi-forms-service';
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
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Shield,
  Award,
  Truck,
  FileCheck,
  Users,
  Star,
  Leaf,
  DollarSign,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Award,
  Truck,
  FileCheck,
  Users,
  Star,
  Leaf,
  DollarSign,
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const YearlyForm: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [targets, setTargets] = useState<YearlyTarget[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Check user permissions
  const canEdit = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'manager';
  const canApprove = user?.role === 'superadmin' || user?.role === 'admin';

  // Load departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const result = await DepartmentService.getDepartments();
        if (result.success) {
          setDepartments(result.data);
          // For managers, filter to only their assigned departments
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

  // Load yearly targets when department/year changes
  useEffect(() => {
    const fetchTargets = async () => {
      if (!selectedDepartment) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await KpiFormsService.getYearlyTargets(selectedDepartment, selectedYear);
        if (result.success) {
          setTargets(result.data);
          // Expand first category
          if (result.data.length > 0) {
            setExpandedCategories(new Set([result.data[0].category_id]));
          }
        }
      } catch (err) {
        console.error('Failed to load yearly targets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTargets();
  }, [selectedDepartment, selectedYear]);

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const updateTarget = (id: number, field: keyof YearlyTarget, value: string | number | null) => {
    setTargets(targets.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const saveTarget = async (target: YearlyTarget) => {
    setSaving(true);
    try {
      await KpiFormsService.saveYearlyTarget({
        id: target.id,
        department_id: selectedDepartment,
        category_id: target.category_id,
        metric_id: target.metric_id,
        fiscal_year: selectedYear,
        company_policy: target.company_policy,
        department_policy: target.department_policy,
        key_actions: target.key_actions,
        remaining_kadai: target.remaining_kadai,
        environment_changes: target.environment_changes,
        fy_target: target.fy_target,
        fy_target_text: target.fy_target_text,
        main_pic: target.main_pic,
        main_support: target.main_support,
        support_sdm: target.support_sdm,
        support_skd: target.support_skd,
      });
      toast({ title: 'Saved successfully' });
    } catch (err) {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const approveTarget = async (id: number, type: 'president' | 'vp' | 'dept_head') => {
    try {
      await KpiFormsService.approveYearlyTarget(id, type);
      setTargets(targets.map((t) => (t.id === id ? { ...t, [`${type}_approved`]: true } : t)));
      toast({ title: 'Approved successfully' });
    } catch (err) {
      toast({ title: 'Failed to approve', variant: 'destructive' });
    }
  };

  // Group targets by category
  const groupedByCategory = targets.reduce(
    (acc, target) => {
      const catId = target.category_id;
      if (!acc[catId]) {
        acc[catId] = {
          name: target.category_name,
          key: target.category_key,
          color: target.color,
          targets: [],
        };
      }
      acc[catId].targets.push(target);
      return acc;
    },
    {} as Record<number, { name: string; key: string; color: string; targets: YearlyTarget[] }>
  );

  return (
    <ShellLayout variant="user">
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Yearly KPI Form (Page 1)</h1>
            <p className="text-gray-500">Set annual targets and key actions for each department</p>
          </div>
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
                Please select a department to view and edit yearly targets
              </p>
            </CardContent>
          </Card>
        )}

        {/* Yearly Targets Form */}
        {!loading && selectedDepartment && Object.keys(groupedByCategory).length > 0 && (
          <div className="space-y-4">
            {Object.entries(groupedByCategory).map(([catId, group]) => {
              const IconComponent = iconMap[group.key] || Shield;
              const isExpanded = expandedCategories.has(parseInt(catId));

              return (
                <Card key={catId} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleCategory(parseInt(catId))}>
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${group.color}20` }}>
                        <IconComponent className="h-5 w-5" style={{ color: group.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-sm text-gray-500">{group.targets.length} indicators</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {group.targets.some((t) => t.president_approved) && (
                        <Badge className="bg-green-100 text-green-800">President Approved</Badge>
                      )}
                      {group.targets.some((t) => t.vp_approved) && (
                        <Badge className="bg-blue-100 text-blue-800">VP Approved</Badge>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="p-4">
                      {/* Policy Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                          <Label>Company Policy</Label>
                          <Textarea
                            value={group.targets[0]?.company_policy || ''}
                            onChange={(e) =>
                              updateTarget(group.targets[0]?.id, 'company_policy', e.target.value)
                            }
                            placeholder="Enter company policy..."
                            rows={3}
                            disabled={!canEdit}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Department Policy</Label>
                          <Textarea
                            value={group.targets[0]?.department_policy || ''}
                            onChange={(e) =>
                              updateTarget(
                                group.targets[0]?.id,
                                'department_policy',
                                e.target.value
                              )
                            }
                            placeholder="Enter department policy..."
                            rows={3}
                            disabled={!canEdit}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-2">
                          <Label>Key Actions</Label>
                          <Textarea
                            value={group.targets[0]?.key_actions || ''}
                            onChange={(e) =>
                              updateTarget(group.targets[0]?.id, 'key_actions', e.target.value)
                            }
                            placeholder="Key actions for FY..."
                            rows={2}
                            disabled={!canEdit}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Remaining Kadai</Label>
                          <Textarea
                            value={group.targets[0]?.remaining_kadai || ''}
                            onChange={(e) =>
                              updateTarget(group.targets[0]?.id, 'remaining_kadai', e.target.value)
                            }
                            placeholder="Remaining issues..."
                            rows={2}
                            disabled={!canEdit}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Environment Changes</Label>
                          <Textarea
                            value={group.targets[0]?.environment_changes || ''}
                            onChange={(e) =>
                              updateTarget(
                                group.targets[0]?.id,
                                'environment_changes',
                                e.target.value
                              )
                            }
                            placeholder="Environmental changes..."
                            rows={2}
                            disabled={!canEdit}
                          />
                        </div>
                      </div>

                      {/* Targets Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left p-2 border">No.</th>
                              <th className="text-left p-2 border">Measurement</th>
                              <th className="text-left p-2 border">Unit</th>
                              <th className="text-left p-2 border">FY Target</th>
                              <th className="text-left p-2 border">Main PIC</th>
                              <th className="text-left p-2 border">Support</th>
                              {canEdit && <th className="p-2 border">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {group.targets.map((target) => (
                              <tr key={target.id} className="hover:bg-gray-50">
                                <td className="p-2 border">{target.metric_no}</td>
                                <td className="p-2 border">{target.measurement}</td>
                                <td className="p-2 border">{target.unit}</td>
                                <td className="p-2 border">
                                  <Input
                                    value={
                                      target.fy_target_text || target.fy_target?.toString() || ''
                                    }
                                    onChange={(e) =>
                                      updateTarget(target.id, 'fy_target_text', e.target.value)
                                    }
                                    className="w-24"
                                    disabled={!canEdit}
                                  />
                                </td>
                                <td className="p-2 border">
                                  <Input
                                    value={target.main_pic || ''}
                                    onChange={(e) =>
                                      updateTarget(target.id, 'main_pic', e.target.value)
                                    }
                                    className="w-32"
                                    disabled={!canEdit}
                                  />
                                </td>
                                <td className="p-2 border">
                                  <Input
                                    value={target.main_support || ''}
                                    onChange={(e) =>
                                      updateTarget(target.id, 'main_support', e.target.value)
                                    }
                                    className="w-32"
                                    disabled={!canEdit}
                                  />
                                </td>
                                {canEdit && (
                                  <td className="p-2 border">
                                    <Button
                                      size="sm"
                                      onClick={() => saveTarget(target)}
                                      disabled={saving}>
                                      <Save className="h-4 w-4" />
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Approval Section */}
                      {canApprove && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveTarget(group.targets[0]?.id, 'president')}
                            disabled={group.targets[0]?.president_approved}
                            className="gap-2">
                            {group.targets[0]?.president_approved ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            President
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveTarget(group.targets[0]?.id, 'vp')}
                            disabled={group.targets[0]?.vp_approved}
                            className="gap-2">
                            {group.targets[0]?.vp_approved ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            VP
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveTarget(group.targets[0]?.id, 'dept_head')}
                            disabled={group.targets[0]?.dept_head_approved}
                            className="gap-2">
                            {group.targets[0]?.dept_head_approved ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            Dept. Head
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* No Data */}
        {!loading && selectedDepartment && Object.keys(groupedByCategory).length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No Yearly Targets</h3>
              <p className="text-gray-500">
                No yearly targets found for this department in FY{selectedYear}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ShellLayout>
  );
};

export default YearlyForm;
