import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import KpiFormsService, { type MonthlyEntry } from '@/services/kpi-forms-service';
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
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Color coding for EV (Evaluation)
const evColors: Record<string, string> = {
  G: 'bg-green-100 text-green-800 border-green-300',
  Y: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  R: 'bg-red-100 text-red-800 border-red-300',
};

export const MonthlyEntry: React.FC = () => {
  const { category } = useParams<{ category?: string }>();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [entries, setEntries] = useState<MonthlyEntry[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const canEdit = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'manager';
  const canApprove = user?.role === 'superadmin' || user?.role === 'admin';

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

  // Load monthly entries
  useEffect(() => {
    const fetchEntries = async () => {
      if (!selectedDepartment) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await KpiFormsService.getMonthlyEntries(selectedDepartment, selectedYear);
        if (result.success) {
          setEntries(result.data);
          if (result.data.length > 0) {
            setExpandedCategories(new Set([result.data[0].category_id]));
          }
        }
      } catch (err) {
        console.error('Failed to load monthly entries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
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

  const updateEntry = (id: number, field: keyof MonthlyEntry, value: string | number | null) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const saveEntry = async (entry: MonthlyEntry) => {
    setSaving(true);
    try {
      await KpiFormsService.saveMonthlyEntry({
        id: entry.id,
        yearly_target_id: entry.yearly_target_id,
        department_id: selectedDepartment,
        category_id: entry.category_id,
        metric_id: entry.metric_id,
        fiscal_year: selectedYear,
        month: entry.month,
        way_of_measurement: entry.way_of_measurement,
        target: entry.target,
        target_text: entry.target_text,
        result: entry.result,
        result_text: entry.result_text,
        ev: entry.ev,
        accu_target: entry.accu_target,
        accu_result: entry.accu_result,
        forecast: entry.forecast,
        reason: entry.reason,
        recover_activity: entry.recover_activity,
        recovery_month: entry.recovery_month,
      });
      toast({ title: 'Saved successfully' });
    } catch (err) {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const approveEntry = async (id: number) => {
    try {
      await KpiFormsService.approveMonthlyEntry(id);
      setEntries(entries.map((e) => (e.id === id ? { ...e, dept_head_approved: true } : e)));
      toast({ title: 'Approved successfully' });
    } catch (err) {
      toast({ title: 'Failed to approve', variant: 'destructive' });
    }
  };

  // Group entries by category and metric
  const groupedData = entries.reduce(
    (acc, entry) => {
      const catId = entry.category_id;
      const metricId = entry.metric_id || 0;

      if (!acc[catId]) {
        acc[catId] = {
          name: entry.category_name,
          key: entry.category_key,
          color: entry.color,
          metrics: {},
        };
      }

      if (!acc[catId].metrics[metricId]) {
        acc[catId].metrics[metricId] = {
          no: entry.metric_no,
          measurement: entry.measurement,
          unit: entry.unit,
          way_of_measurement: entry.way_of_measurement,
          months: {},
        };
      }

      acc[catId].metrics[metricId].months[entry.month] = entry;
      return acc;
    },
    {} as Record<
      number,
      {
        name: string;
        key: string;
        color: string;
        metrics: Record<
          number,
          {
            no: string;
            measurement: string;
            unit: string;
            way_of_measurement: string | null;
            months: Record<number, MonthlyEntry>;
          }
        >;
      }
    >
  );

  return (
    <ShellLayout variant="user">
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Monthly KPI Entry (Page 2&3)</h1>
            <p className="text-gray-500">Track monthly performance against yearly targets</p>
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
              <Skeleton key={i} className="h-60 w-full" />
            ))}
          </div>
        )}

        {/* No Department Selected */}
        {!selectedDepartment && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">Select a Department</h3>
              <p className="text-gray-500">Please select a department to view monthly entries</p>
            </CardContent>
          </Card>
        )}

        {/* Monthly Entries */}
        {!loading && selectedDepartment && Object.keys(groupedData).length > 0 && (
          <div className="space-y-4">
            {Object.entries(groupedData).map(([catId, group]) => {
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
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: group.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-sm text-gray-500">
                          {Object.keys(group.metrics).length} indicators
                        </p>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="p-2 border text-left min-w-[200px]">Measurement</th>
                              <th className="p-2 border text-center">Unit</th>
                              {months.map((m, i) => (
                                <th key={m} className="p-1 border text-center min-w-[100px]">
                                  {m}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(group.metrics).map(([metricId, metric]) => (
                              <>
                                {/* Target Row */}
                                <tr key={`${metricId}-target`} className="bg-blue-50">
                                  <td className="p-2 border font-medium" rowSpan={2}>
                                    <div>
                                      {metric.no}. {metric.measurement}
                                    </div>
                                    {metric.way_of_measurement && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Way: {metric.way_of_measurement}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-2 border text-center" rowSpan={2}>
                                    {metric.unit}
                                  </td>
                                  {months.map((m, i) => {
                                    const entry = metric.months[i + 1];
                                    return (
                                      <td key={`${m}-target`} className="p-1 border">
                                        <Input
                                          value={
                                            entry?.target_text || entry?.target?.toString() || ''
                                          }
                                          onChange={(e) =>
                                            entry &&
                                            updateEntry(entry.id, 'target_text', e.target.value)
                                          }
                                          placeholder="T"
                                          className="h-7 w-full text-center text-xs"
                                          disabled={!canEdit}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                                {/* Result Row */}
                                <tr key={`${metricId}-result`}>
                                  {months.map((m, i) => {
                                    const entry = metric.months[i + 1];
                                    return (
                                      <td key={`${m}-result`} className="p-1 border">
                                        <div className="flex gap-1">
                                          <Input
                                            value={
                                              entry?.result_text || entry?.result?.toString() || ''
                                            }
                                            onChange={(e) =>
                                              entry &&
                                              updateEntry(entry.id, 'result_text', e.target.value)
                                            }
                                            placeholder="R"
                                            className="h-7 w-16 text-center text-xs"
                                            disabled={!canEdit}
                                          />
                                          <Select
                                            value={entry?.ev || ''}
                                            onValueChange={(v) =>
                                              entry && updateEntry(entry.id, 'ev', v)
                                            }>
                                            <SelectTrigger className="h-7 w-10 p-0 text-xs">
                                              <span className={entry?.ev ? evColors[entry.ev] : ''}>
                                                {entry?.ev || '-'}
                                              </span>
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="G">G</SelectItem>
                                              <SelectItem value="Y">Y</SelectItem>
                                              <SelectItem value="R">R</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        {entry?.dept_head_approved && (
                                          <CheckCircle className="h-3 w-3 text-green-600 mx-auto mt-1" />
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              </>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Actions */}
                      {canEdit && (
                        <div className="p-4 border-t flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              // Save all entries in this category
                              const catEntries = entries.filter(
                                (e) => e.category_id === parseInt(catId)
                              );
                              catEntries.forEach((e) => saveEntry(e));
                            }}
                            disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            Save All
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
        {!loading && selectedDepartment && Object.keys(groupedData).length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No Monthly Entries</h3>
              <p className="text-gray-500">
                No monthly entries found for this department in FY{selectedYear}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ShellLayout>
  );
};

export default MonthlyEntry;
