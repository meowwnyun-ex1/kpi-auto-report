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
import { Calendar, Save, Loader2, Plus, Trash2 } from 'lucide-react';

interface Department {
  dept_id: string;
  name_en: string;
}

interface YearlyTarget {
  id?: number;
  category_id: number;
  category_name: string;
  category_key: string;
  metric_id: number | null;
  metric_no: string;
  metric_name: string;
  unit: string;
  measurement: string;
  fy_target: number | null;
  fy_target_text: string | null;
  company_policy: string | null;
  department_policy: string | null;
  key_actions: string | null;
  remaining_kadai: string | null;
  environment_changes: string | null;
  main_pic: string | null;
  main_support: string | null;
  support_sdm: string | null;
  support_skd: string | null;
}

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

export default function YearlyTargetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [yearlyTargets, setYearlyTargets] = useState<YearlyTarget[]>([]);

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
      const res = await fetch(`/api/kpi-forms/yearly/${selectedDept}/${selectedYear}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) {
        setYearlyTargets(data.data.length > 0 ? data.data : [createEmptyYearlyTarget()]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmptyYearlyTarget = (): YearlyTarget => ({
    category_id: 1,
    category_name: 'Safety',
    category_key: 'safety',
    metric_no: '',
    metric_name: '',
    unit: '',
    measurement: '',
    fy_target: null,
    fy_target_text: null,
    company_policy: null,
    department_policy: null,
    key_actions: null,
    remaining_kadai: null,
    environment_changes: null,
    main_pic: null,
    main_support: null,
    support_sdm: null,
    support_skd: null,
  });

  const addTarget = () => setYearlyTargets([...yearlyTargets, createEmptyYearlyTarget()]);
  const removeTarget = (index: number) =>
    setYearlyTargets(yearlyTargets.filter((_, i) => i !== index));
  const updateTarget = (
    index: number,
    field: keyof YearlyTarget,
    value: string | number | null
  ) => {
    const updated = [...yearlyTargets];
    updated[index][field] = value as never;
    setYearlyTargets(updated);
  };

  const saveData = async () => {
    if (!canEdit) {
      toast({ title: 'Error', description: 'No permission to edit', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/kpi-forms/yearly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          department_id: selectedDept,
          fiscal_year: selectedYear,
          targets: yearlyTargets.filter((t) => t.metric_name),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Yearly targets saved successfully' });
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
            <h1 className="text-3xl font-bold">Yearly Targets</h1>
            <p className="text-muted-foreground">Set FY targets for each category</p>
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
                <Calendar className="h-4 w-4 mr-1" />
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
                FY{selectedYear} Targets -{' '}
                {departments.find((d) => d.dept_id === selectedDept)?.name_en || selectedDept}
              </CardTitle>
              {canEdit && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={addTarget}>
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
                      <TableHead className="w-24">FY Target</TableHead>
                      <TableHead>Key Actions</TableHead>
                      <TableHead className="w-28">Main PIC</TableHead>
                      {canEdit && <TableHead className="w-16"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearlyTargets.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge variant="outline">{row.category_name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.metric_no || ''}
                            onChange={(e) => updateTarget(i, 'metric_no', e.target.value)}
                            disabled={!canEdit}
                            className="border-0 bg-transparent w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.metric_name}
                            onChange={(e) => updateTarget(i, 'metric_name', e.target.value)}
                            disabled={!canEdit}
                            className="border-0 bg-transparent"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.unit || ''}
                            onChange={(e) => updateTarget(i, 'unit', e.target.value)}
                            disabled={!canEdit}
                            className="border-0 bg-transparent w-12"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.fy_target ?? ''}
                            onChange={(e) => updateTarget(i, 'fy_target', e.target.value)}
                            disabled={!canEdit}
                            className="border-0 bg-transparent w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.key_actions || ''}
                            onChange={(e) => updateTarget(i, 'key_actions', e.target.value)}
                            disabled={!canEdit}
                            className="border-0 bg-transparent"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.main_pic || ''}
                            onChange={(e) => updateTarget(i, 'main_pic', e.target.value)}
                            disabled={!canEdit}
                            className="border-0 bg-transparent"
                          />
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => removeTarget(i)}>
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
