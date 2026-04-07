import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { ClipboardList, Save, Loader2, Plus, Trash2 } from 'lucide-react';

interface Department {
  dept_id: string;
  name_en: string;
}

interface MonthlyEntry {
  id?: number;
  yearly_target_id: number | null;
  category_id: number;
  category_name: string;
  category_key: string;
  metric_id: number | null;
  metric_no: string;
  metric_name: string;
  unit: string;
  month: number;
  target: number | null;
  target_text: string | null;
  result: number | null;
  result_text: string | null;
  ev: string | null;
  accu_target: number | null;
  accu_result: number | null;
  forecast: number | null;
  reason: string | null;
  recover_activity: string | null;
  recovery_month: number | null;
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

export default function MonthlyEntryPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monthlyEntries, setMonthlyEntries] = useState<MonthlyEntry[]>([]);

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
  }, [selectedDept, selectedYear, selectedMonth]);

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
      const res = await fetch(`/api/kpi-forms/monthly/${selectedDept}/${selectedYear}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) {
        const filtered = data.data.filter((e: MonthlyEntry) => e.month === selectedMonth);
        setMonthlyEntries(filtered.length > 0 ? filtered : [createEmptyEntry()]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmptyEntry = (): MonthlyEntry => ({
    yearly_target_id: null,
    category_id: 1,
    category_name: 'Safety',
    category_key: 'safety',
    metric_id: null,
    metric_no: '',
    metric_name: '',
    unit: '',
    month: selectedMonth,
    target: null,
    target_text: null,
    result: null,
    result_text: null,
    ev: null,
    accu_target: null,
    accu_result: null,
    forecast: null,
    reason: null,
    recover_activity: null,
    recovery_month: null,
  });

  const addEntry = () => setMonthlyEntries([...monthlyEntries, createEmptyEntry()]);
  const removeEntry = (index: number) =>
    setMonthlyEntries(monthlyEntries.filter((_, i) => i !== index));
  const updateEntry = (index: number, field: keyof MonthlyEntry, value: string | number) => {
    const updated = [...monthlyEntries];
    updated[index][field] = value as never;
    setMonthlyEntries(updated);
  };

  const saveData = async () => {
    if (!canEdit) {
      toast({ title: 'Error', description: 'No permission to edit', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/kpi-forms/monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          department_id: selectedDept,
          fiscal_year: selectedYear,
          entries: monthlyEntries.filter((e) => e.metric_name),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Monthly entries saved successfully' });
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
            <h1 className="text-3xl font-bold">Monthly Entry</h1>
            <p className="text-muted-foreground">Enter monthly KPI results</p>
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
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-24">
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
          </div>
        </div>

        {/* Form */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {MONTHS[selectedMonth - 1]} {selectedYear} -{' '}
                {departments.find((d) => d.dept_id === selectedDept)?.name_en || selectedDept}
              </CardTitle>
              {canEdit && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={addEntry}>
                    <Plus className="h-4 w-4 mr-1" /> Add Row
                  </Button>
                  <Button size="sm" onClick={saveData} disabled={saving}>
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
                      <TableHead className="w-20">Metric No</TableHead>
                      <TableHead>Metric Name</TableHead>
                      <TableHead className="w-16">Unit</TableHead>
                      <TableHead className="w-20">Target</TableHead>
                      <TableHead className="w-20">Result</TableHead>
                      <TableHead className="w-12">EV</TableHead>
                      <TableHead className="w-20">Forecast</TableHead>
                      {canEdit && <TableHead className="w-16"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyEntries.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge variant="outline">{row.category_name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.metric_no || ''}
                            onChange={(e) => updateEntry(i, 'metric_no', e.target.value)}
                            disabled={!canEdit}
                            className="border-0 bg-transparent w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.metric_name}
                            onChange={(e) => updateEntry(i, 'metric_name', e.target.value)}
                            disabled={!canEdit}
                            className="border-0 bg-transparent"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.unit || ''}
                            onChange={(e) => updateEntry(i, 'unit', e.target.value)}
                            disabled={!canEdit}
                            className="border-0 bg-transparent w-12"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.target ?? ''}
                            onChange={(e) =>
                              updateEntry(
                                i,
                                'target',
                                e.target.value ? parseFloat(e.target.value) : null
                              )
                            }
                            disabled={!canEdit}
                            className="border-0 bg-transparent w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.result ?? ''}
                            onChange={(e) =>
                              updateEntry(
                                i,
                                'result',
                                e.target.value ? parseFloat(e.target.value) : null
                              )
                            }
                            disabled={!canEdit}
                            className="border-0 bg-transparent w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.ev || ''}
                            onChange={(e) => updateEntry(i, 'ev', e.target.value)}
                            disabled={!canEdit}
                            className="border-0 bg-transparent w-10"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.forecast ?? ''}
                            onChange={(e) =>
                              updateEntry(
                                i,
                                'forecast',
                                e.target.value ? parseFloat(e.target.value) : null
                              )
                            }
                            disabled={!canEdit}
                            className="border-0 bg-transparent w-20"
                          />
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => removeEntry(i)}>
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
        )}
      </div>
    </ShellLayout>
  );
}
