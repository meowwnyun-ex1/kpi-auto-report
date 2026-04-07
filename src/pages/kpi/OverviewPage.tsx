import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  BarChart3,
  Calendar,
  ClipboardList,
  GanttChart,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface Department {
  dept_id: string;
  name_en: string;
}

interface YearlyTarget {
  id?: number;
  department_id?: string;
  department_name?: string;
  category_id: number;
  category_name: string;
  category_key: string;
  metric_no: string;
  metric_name: string;
  unit: string;
  fy_target: number | null;
  fy_target_text: string | null;
  key_actions: string | null;
  main_pic: string | null;
}

interface MonthlyEntry {
  id?: number;
  department_id?: string;
  department_name?: string;
  category_name: string;
  metric_no: string;
  metric_name: string;
  frequency: string;
  unit: string;
  month: number;
  fy_target: number | null;
  target: number | null;
  result: number | null;
  judge: string | null;
  accu_target: number | null;
  accu_result: number | null;
  accu_judge: string | null;
  ev: string | null;
  forecast: number | null;
}

interface ActionPlan {
  id?: number;
  key_action: string;
  action_plan: string;
  person_in_charge: string | null;
  start_month: number;
  end_month: number;
  status: string;
  progress_percent: number;
}

interface DepartmentStatus {
  dept_id: string;
  dept_name: string;
  has_yearly_targets: boolean;
  has_monthly_results: boolean;
  target_count: number;
  result_count: number;
  missing_data: boolean;
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Safety: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  Quality: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  Delivery: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Compliance: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  HR: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Attractive: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  Environment: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  Cost: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

export default function OverviewPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

  const [yearlyTargets, setYearlyTargets] = useState<YearlyTarget[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<MonthlyEntry[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [selectedYear, selectedMonth, selectedDept]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) setDepartments(data.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch yearly targets
      const yearlyUrl =
        selectedDept === 'all'
          ? `/api/kpi-forms/yearly/all/${selectedYear}`
          : `/api/kpi-forms/yearly/${selectedDept}/${selectedYear}`;
      const yearlyRes = await fetch(yearlyUrl, { headers });
      const yearlyData = await yearlyRes.json();
      if (yearlyData.success) setYearlyTargets(yearlyData.data || []);

      // Fetch monthly entries
      const monthlyUrl =
        selectedDept === 'all'
          ? `/api/kpi-forms/monthly/all/${selectedYear}/${selectedMonth}`
          : `/api/kpi-forms/monthly/${selectedDept}/${selectedYear}`;
      const monthlyRes = await fetch(monthlyUrl, { headers });
      const monthlyData = await monthlyRes.json();
      if (monthlyData.success) setMonthlyEntries(monthlyData.data || []);

      // Fetch action plans
      const actionUrl =
        selectedDept === 'all'
          ? `/api/kpi-forms/action-plans/all/${selectedYear}`
          : `/api/kpi-forms/action-plans/${selectedDept}/${selectedYear}`;
      const actionRes = await fetch(actionUrl, { headers });
      const actionData = await actionRes.json();
      if (actionData.success) setActionPlans(actionData.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate category stats
  const categoryStats = CATEGORIES.map((cat) => {
    const targets = yearlyTargets.filter((t) => t.category_name === cat);
    const entries = monthlyEntries.filter((m) => m.category_name === cat);

    const totalTarget = targets.reduce((sum, t) => sum + (t.fy_target || 0), 0);
    const totalResult = entries.reduce((sum, e) => sum + (e.result || 0), 0);
    const avgAchievement = totalTarget > 0 ? totalResult / targets.length : 0;

    return {
      category: cat,
      targetCount: targets.length,
      entryCount: entries.length,
      totalTarget,
      totalResult,
      avgAchievement,
      colors: CATEGORY_COLORS[cat],
    };
  });

  // Action plan stats
  const validPlans = actionPlans.filter((p) => p.key_action);
  const completedPlans = validPlans.filter((p) => p.status === 'Completed').length;
  const avgProgress =
    validPlans.length > 0
      ? Math.round(validPlans.reduce((sum, p) => sum + p.progress_percent, 0) / validPlans.length)
      : 0;

  // Department status tracking - which departments have KPI data
  const departmentStatus: DepartmentStatus[] = departments.map((dept) => {
    const deptTargets = yearlyTargets.filter(
      (t) => t.department_id === dept.dept_id || t.department_name === dept.name_en
    );
    const deptResults = monthlyEntries.filter(
      (m) => m.department_id === dept.dept_id || m.department_name === dept.name_en
    );

    return {
      dept_id: dept.dept_id,
      dept_name: dept.name_en,
      has_yearly_targets: deptTargets.length > 0,
      has_monthly_results: deptResults.length > 0,
      target_count: deptTargets.length,
      result_count: deptResults.length,
      missing_data: deptTargets.length === 0 || deptResults.length === 0,
    };
  });

  const departmentsWithMissingData = departmentStatus.filter((d) => d.missing_data);

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

  return (
    <ShellLayout variant="sidebar">
      <div className="container mx-auto py-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Overview</h1>
            <p className="text-sm text-muted-foreground">KPI Results Dashboard</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
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
              <SelectTrigger className="w-24">
                <Calendar className="h-4 w-4 mr-1" />
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
              <SelectTrigger className="w-20">
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

        {/* Summary Cards */}
        <div className="grid gap-3 md:grid-cols-5">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Targets</p>
                <p className="text-lg font-bold">
                  {yearlyTargets.filter((t) => t.metric_name).length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Results</p>
                <p className="text-lg font-bold">
                  {monthlyEntries.filter((m) => m.metric_name).length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <GanttChart className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Actions</p>
                <p className="text-lg font-bold">{validPlans.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-lg font-bold">{avgProgress}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Missing Data</p>
                <p className="text-lg font-bold text-amber-600">
                  {departmentsWithMissingData.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="results">Target & Result</TabsTrigger>
            <TabsTrigger value="targets">Yearly Targets</TabsTrigger>
            <TabsTrigger value="actions">Action Plans</TabsTrigger>
            <TabsTrigger value="status">
              Department Status
              {departmentsWithMissingData.length > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {departmentsWithMissingData.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Target & Result Tab */}
          <TabsContent value="results" className="mt-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">
                  Company KPI Summary Result - {MONTHS[selectedMonth - 1]} {selectedYear}
                </CardTitle>
                <CardDescription>
                  FY{selectedYear} Target vs Result with Achievement Status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[calc(100vh-320px)]">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-16">No.</TableHead>
                        <TableHead>Metric Name</TableHead>
                        <TableHead className="w-12">Freq</TableHead>
                        <TableHead className="w-16">Unit</TableHead>
                        <TableHead className="text-center">FY Target</TableHead>
                        <TableHead className="text-center">Target</TableHead>
                        <TableHead className="text-center">Result</TableHead>
                        <TableHead className="text-center w-12">Judge</TableHead>
                        <TableHead className="text-center">Accu. Target</TableHead>
                        <TableHead className="text-center">Accu. Result</TableHead>
                        <TableHead className="text-center w-12">Accu. Judge</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyEntries.filter((m) => m.metric_name).length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={11}
                            className="text-center py-8 text-muted-foreground">
                            No data for {MONTHS[selectedMonth - 1]}
                          </TableCell>
                        </TableRow>
                      ) : (
                        monthlyEntries
                          .filter((m) => m.metric_name)
                          .map((row, i) => (
                            <TableRow key={i} className="hover:bg-muted/30">
                              <TableCell className="font-mono">{row.metric_no}</TableCell>
                              <TableCell className="font-medium">{row.metric_name}</TableCell>
                              <TableCell>{row.frequency || '-'}</TableCell>
                              <TableCell>{row.unit}</TableCell>
                              <TableCell className="text-center font-medium text-blue-600">
                                {row.fy_target ?? '-'}
                              </TableCell>
                              <TableCell className="text-center font-medium text-blue-600">
                                {row.target ?? '-'}
                              </TableCell>
                              <TableCell className="text-center font-medium text-green-600">
                                {row.result ?? '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={row.judge === 'O' ? 'default' : 'destructive'}
                                  className={`h-5 w-5 p-0 flex items-center justify-center text-xs ${
                                    row.judge === 'O' ? 'bg-green-500' : ''
                                  }`}>
                                  {row.judge || '-'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-blue-600">
                                {row.accu_target ?? '-'}
                              </TableCell>
                              <TableCell className="text-center text-green-600">
                                {row.accu_result ?? '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={row.accu_judge === 'O' ? 'default' : 'destructive'}
                                  className={`h-5 w-5 p-0 flex items-center justify-center text-xs ${
                                    row.accu_judge === 'O' ? 'bg-green-500' : ''
                                  }`}>
                                  {row.accu_judge || '-'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Yearly Targets Tab */}
          <TabsContent value="targets" className="mt-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Yearly Targets - FY{selectedYear}</CardTitle>
                <CardDescription>All defined metrics and FY targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[calc(100vh-320px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Metric No</TableHead>
                        <TableHead>Metric Name</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-center">FY Target</TableHead>
                        <TableHead>PIC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yearlyTargets.filter((t) => t.metric_name).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No yearly targets defined
                          </TableCell>
                        </TableRow>
                      ) : (
                        yearlyTargets
                          .filter((t) => t.metric_name)
                          .map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-sm">
                                {row.department_name || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={CATEGORY_COLORS[row.category_name]?.text}>
                                  {row.category_name}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{row.metric_no}</TableCell>
                              <TableCell className="text-sm">{row.metric_name}</TableCell>
                              <TableCell className="text-sm">{row.unit}</TableCell>
                              <TableCell className="text-center font-medium text-blue-600">
                                {row.fy_target ?? '-'}
                              </TableCell>
                              <TableCell className="text-sm">{row.main_pic || '-'}</TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Action Plans Tab */}
          <TabsContent value="actions" className="mt-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GanttChart className="h-4 w-4" />
                  Action Plans Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[calc(100vh-320px)]">
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 text-xs mb-3">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-green-500"></div>
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-blue-500"></div>
                      <span>In Progress</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-amber-500"></div>
                      <span>Planned</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-red-500"></div>
                      <span>Delayed</span>
                    </div>
                  </div>

                  {/* Gantt Chart */}
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-[1fr_repeat(12,50px)] gap-1 mb-2">
                      <div className="font-medium text-xs p-1">Action Plan</div>
                      {MONTHS.map((m) => (
                        <div key={m} className="text-center text-xs font-medium p-1 border-b">
                          {m}
                        </div>
                      ))}
                    </div>

                    {validPlans.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No action plans to display
                      </div>
                    ) : (
                      validPlans.map((plan, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-[1fr_repeat(12,50px)] gap-1 border-b py-1">
                          <div className="p-1">
                            <div className="text-xs font-medium truncate">{plan.key_action}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge
                                variant="outline"
                                className={`text-xs ${getStatusColor(plan.status)} text-white border-0 h-4`}>
                                {plan.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {plan.progress_percent}%
                              </span>
                            </div>
                          </div>
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
                                    className={`absolute top-0.5 bottom-0.5 left-0.5 right-0.5 rounded ${
                                      plan.status === 'Completed'
                                        ? 'bg-green-200'
                                        : plan.status === 'Delayed'
                                          ? 'bg-red-200'
                                          : 'bg-gray-200'
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Department Status Tab */}
          <TabsContent value="status" className="mt-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Department KPI Data Status
                </CardTitle>
                <CardDescription>Track which departments have entered KPI data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[calc(100vh-320px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-center">Yearly Targets</TableHead>
                        <TableHead className="text-center">Monthly Results</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departmentStatus.map((dept) => (
                        <TableRow key={dept.dept_id}>
                          <TableCell className="font-medium">{dept.dept_name}</TableCell>
                          <TableCell className="text-center">
                            {dept.has_yearly_targets ? (
                              <div className="flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>{dept.target_count}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <span className="text-amber-600">None</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {dept.has_monthly_results ? (
                              <div className="flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>{dept.result_count}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <span className="text-amber-600">None</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {dept.missing_data ? (
                              <Badge variant="destructive">Incomplete</Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-500">
                                Complete
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ShellLayout>
  );
}
