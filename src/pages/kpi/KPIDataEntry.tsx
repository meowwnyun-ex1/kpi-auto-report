import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { UnifiedError } from '@/components/ui/unified-error';
import { KPICategory, getCategoryConfig, KPI_CATEGORY_CONFIGS } from '@/shared/types/kpi';
import { getKPIService, type KPIDataEntry as KPIDataEntryType } from '@/services/kpi-service';
import DepartmentService, {
  type Department,
  type DepartmentMetric,
} from '@/services/department-service';
import {
  Shield,
  Award,
  Truck,
  FileCheck,
  Users,
  Star,
  Leaf,
  DollarSign,
  Save,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  History,
} from 'lucide-react';

// Icon mapping
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

interface DataEntryForm {
  id?: number;
  metric_id: number;
  measurement: string;
  unit: string;
  target: string;
  result: string;
  accu_target: string;
  accu_result: string;
  forecast: string;
  reason: string;
  recover_activity: string;
  recovery_month: string;
}

interface DepartmentWithStatus {
  dept_id: string;
  name_en: string;
  has_metrics: boolean;
  metric_count: number;
  filled_count: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const KPIDataEntry: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category selection first
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Departments that have metrics for the selected category
  const [departmentsWithMetrics, setDepartmentsWithMetrics] = useState<DepartmentWithStatus[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  // Sub-categories with their metrics
  const [subCategoriesWithMetrics, setSubCategoriesWithMetrics] = useState<
    Map<string, { name: string; metrics: DepartmentMetric[] }>
  >(new Map());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());

  // Form data
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [entries, setEntries] = useState<Map<number, DataEntryForm>>(new Map());

  // Historical data view
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Get category config
  const categoryConfig = selectedCategory
    ? getCategoryConfig(selectedCategory as KPICategory)
    : null;
  const IconComponent = categoryConfig?.icon ? iconMap[categoryConfig.icon] || Shield : Shield;

  // Load departments with metrics for selected category
  useEffect(() => {
    const fetchDepartmentsForCategory = async () => {
      if (!selectedCategory) {
        setDepartmentsWithMetrics([]);
        setSelectedDepartment('');
        return;
      }

      setLoading(true);
      try {
        // Fetch departments that have metrics for this category
        const result = await DepartmentService.getDepartmentsWithMetrics(selectedCategory);
        if (result.success) {
          setDepartmentsWithMetrics(result.data);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartmentsForCategory();
  }, [selectedCategory]);

  // Reset department when category changes
  useEffect(() => {
    setSelectedDepartment('');
    setSubCategoriesWithMetrics(new Map());
    setEntries(new Map());
  }, [selectedCategory]);

  // Load metrics when department is selected
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!selectedCategory || !selectedDepartment) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setSubCategoriesWithMetrics(new Map());

      try {
        const result = await DepartmentService.getDepartmentMetrics(
          selectedDepartment,
          selectedCategory
        );

        if (result.success && result.data.length > 0) {
          // Group metrics by sub-category
          const grouped = new Map<string, { name: string; metrics: DepartmentMetric[] }>();

          for (const metric of result.data) {
            const key = metric.sub_category_key;
            if (!grouped.has(key)) {
              grouped.set(key, {
                name: metric.sub_category_name,
                metrics: [],
              });
            }
            grouped.get(key)!.metrics.push(metric);
          }

          setSubCategoriesWithMetrics(grouped);

          // Expand first sub-category by default
          const firstKey = grouped.keys().next().value;
          if (firstKey) {
            setExpandedSubCategories(new Set([firstKey]));
          }

          // Load existing entries
          await loadExistingEntries(result.data);
        }
      } catch (err) {
        console.error('Failed to load metrics:', err);
        setError('Failed to load metrics for this department');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedCategory, selectedDepartment]);

  // Load existing entries for the selected period
  const loadExistingEntries = async (metrics: DepartmentMetric[]) => {
    try {
      const kpiService = getKPIService(selectedCategory);
      const result = await kpiService.getEntries({
        year: selectedYear,
        month: selectedMonth,
      });

      if (result.success && result.data.length > 0) {
        const entriesMap = new Map<number, DataEntryForm>();

        for (const entry of result.data) {
          entriesMap.set(entry.metric_id, {
            id: entry.id,
            metric_id: entry.metric_id,
            measurement: entry.measurement || '',
            unit: entry.unit || '',
            target: entry.target || '',
            result: entry.result || '',
            accu_target: entry.accu_target || '',
            accu_result: entry.accu_result || '',
            forecast: entry.forecast || '',
            reason: entry.reason || '',
            recover_activity: entry.recover_activity || '',
            recovery_month: entry.recovery_month || '',
          });
        }

        setEntries(entriesMap);
      } else {
        // Initialize empty entries for all metrics
        const entriesMap = new Map<number, DataEntryForm>();
        for (const metric of metrics) {
          entriesMap.set(metric.id, {
            metric_id: metric.id,
            measurement: metric.measurement,
            unit: metric.unit || '',
            target: metric.fy25_target || '',
            result: '',
            accu_target: '',
            accu_result: '',
            forecast: '',
            reason: '',
            recover_activity: '',
            recovery_month: '',
          });
        }
        setEntries(entriesMap);
      }
    } catch (err) {
      console.error('Failed to load existing entries:', err);
    }
  };

  // Reload entries when period changes
  useEffect(() => {
    if (selectedDepartment && subCategoriesWithMetrics.size > 0) {
      const allMetrics = Array.from(subCategoriesWithMetrics.values()).flatMap((g) => g.metrics);
      loadExistingEntries(allMetrics);
    }
  }, [selectedYear, selectedMonth]);

  const toggleSubCategory = (key: string) => {
    const newExpanded = new Set(expandedSubCategories);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubCategories(newExpanded);
  };

  const updateEntry = (metricId: number, field: keyof DataEntryForm, value: string) => {
    const newEntries = new Map(entries);
    const entry = newEntries.get(metricId);
    if (entry) {
      (entry as any)[field] = value;
      newEntries.set(metricId, { ...entry });
      setEntries(newEntries);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const entriesToSave = Array.from(entries.values()).filter((e) => e.result || e.accu_result);

    if (entriesToSave.length === 0) {
      toast({
        title: 'No data to save',
        description: 'Please enter at least one result value',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const kpiService = getKPIService(selectedCategory);
      let savedCount = 0;

      for (const entry of entriesToSave) {
        if (entry.id) {
          // Update existing
          await kpiService.updateEntry(entry.id, {
            result: entry.result,
            accu_result: entry.accu_result,
            forecast: entry.forecast,
            reason: entry.reason,
            recover_activity: entry.recover_activity,
            recovery_month: entry.recovery_month,
          });
        } else {
          // Create new - would need a create endpoint
          // For now, we'll use update with the metric_id
          await kpiService.updateEntry(entry.metric_id, {
            result: entry.result,
            accu_result: entry.accu_result,
            forecast: entry.forecast,
            reason: entry.reason,
            recover_activity: entry.recover_activity,
            recovery_month: entry.recovery_month,
          });
        }
        savedCount++;
      }

      toast({
        title: 'Data saved successfully',
        description: `${savedCount} entries saved`,
      });

      // Refresh historical data
      loadHistoricalData();
    } catch (err) {
      console.error('Failed to save data:', err);
      toast({
        title: 'Failed to save data',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Load historical data for all periods
  const loadHistoricalData = async () => {
    if (!selectedCategory || !selectedDepartment) return;

    setHistoryLoading(true);
    try {
      const kpiService = getKPIService(selectedCategory);
      const result = await kpiService.getAllEntries({
        department_id: selectedDepartment,
      });

      if (result.success) {
        setHistoricalData(result.data);
      }
    } catch (err) {
      console.error('Failed to load historical data:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load historical data when department is selected
  useEffect(() => {
    if (selectedDepartment && selectedCategory) {
      loadHistoricalData();
    }
  }, [selectedDepartment, selectedCategory]);

  return (
    <ShellLayout variant="user">
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {selectedCategory && categoryConfig && (
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${categoryConfig.color}20` }}>
                <IconComponent className="h-6 w-6" style={{ color: categoryConfig.color }} />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {categoryConfig?.name_en || 'KPI'} Data Entry
              </h1>
              <p className="text-sm text-gray-500">{categoryConfig?.description || 'Select a category to begin'}</p>
            </div>
          </div>
        </div>

        {/* Category Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select KPI Category</CardTitle>
            <CardDescription>Choose the KPI category to enter data for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {KPI_CATEGORY_CONFIGS.map((cat) => {
                const config = getCategoryConfig(cat.key as KPICategory);
                const CatIcon = config?.icon ? iconMap[config.icon] || Shield : Shield;
                const isSelected = selectedCategory === cat.key;
                return (
                  <Button
                    key={cat.key}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`h-auto py-4 flex flex-col items-center gap-2 ${
                      isSelected ? 'ring-2 ring-offset-2' : ''
                    }`}
                    style={isSelected ? { backgroundColor: config?.color } : {}}
                    onClick={() => setSelectedCategory(cat.key)}>
                    <CatIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">{cat.name_en}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Department & Period Selection */}
        {selectedCategory && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Department & Period</CardTitle>
              <CardDescription>
                Departments shown have KPI metrics for {categoryConfig?.name_en}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Department Select */}
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
                    {departmentsWithMetrics.map((dept) => (
                      <SelectItem key={dept.dept_id} value={dept.dept_id}>
                        <div className="flex items-center gap-2">
                          {dept.filled_count === dept.metric_count ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                          )}
                          <span>{dept.name_en}</span>
                          <span className="text-xs text-muted-foreground">
                            ({dept.filled_count}/{dept.metric_count})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Year
                </Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Month
                </Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && selectedDepartment && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <UnifiedError
            type="data-error"
            title="Unable to load data"
            message={error}
            showRetry
            onRetry={() => setSelectedDepartment(selectedDepartment)}
          />
        )}

        {/* No Department Selected */}
        {!selectedDepartment && !loading && selectedCategory && (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Department</h3>
              <p className="text-gray-500">
                {departmentsWithMetrics.length > 0
                  ? `${departmentsWithMetrics.length} departments have KPI metrics for ${categoryConfig?.name_en}`
                  : 'No departments have metrics for this category yet'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Data Entry Form with Tabs */}
        {!loading && !error && selectedDepartment && subCategoriesWithMetrics.size > 0 && (
          <Tabs defaultValue="entry" className="space-y-4">
            <TabsList>
              <TabsTrigger value="entry" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Data Entry
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historical Data
              </TabsTrigger>
            </TabsList>

            {/* Data Entry Tab */}
            <TabsContent value="entry">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Sub-Categories with Metrics */}
                {Array.from(subCategoriesWithMetrics.entries()).map(([key, group]) => (
                  <Card key={key} className="overflow-hidden">
                    {/* Sub-Category Header */}
                    <div
                      className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleSubCategory(key)}>
                      <div className="flex items-center gap-3">
                        {expandedSubCategories.has(key) ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-500">{group.metrics.length} indicators</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {group.metrics.filter((m) => entries.get(m.id)?.result).length} /{' '}
                        {group.metrics.length} filled
                      </Badge>
                    </div>

                    {/* Metrics Table */}
                    {expandedSubCategories.has(key) && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-y">
                            <tr>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 w-48">
                                Measurement
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 w-20">
                                Unit
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 w-24">
                                Target
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 w-24">
                                Result
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 w-28">
                                Accumulated
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 w-24">
                                Forecast
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                Recovery Plan
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {group.metrics.map((metric) => {
                              const entry = entries.get(metric.id);
                              if (!entry) return null;

                              return (
                                <tr key={metric.id} className="hover:bg-gray-50">
                                  <td className="py-3 px-4">
                                    <span className="text-sm">{metric.measurement}</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-sm text-gray-600">{metric.unit || '-'}</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Input
                                      type="text"
                                      value={entry.target}
                                      onChange={(e) => updateEntry(metric.id, 'target', e.target.value)}
                                      className="h-8 w-20"
                                      placeholder="Target"
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <Input
                                      type="text"
                                      value={entry.result}
                                      onChange={(e) => updateEntry(metric.id, 'result', e.target.value)}
                                      className="h-8 w-20"
                                      placeholder="Result"
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex gap-1">
                                      <Input
                                        type="text"
                                        value={entry.accu_target}
                                        onChange={(e) =>
                                          updateEntry(metric.id, 'accu_target', e.target.value)
                                        }
                                        className="h-8 w-16"
                                        placeholder="Target"
                                      />
                                      <Input
                                        type="text"
                                        value={entry.accu_result}
                                        onChange={(e) =>
                                          updateEntry(metric.id, 'accu_result', e.target.value)
                                        }
                                        className="h-8 w-16"
                                        placeholder="Result"
                                      />
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Input
                                      type="text"
                                      value={entry.forecast}
                                      onChange={(e) =>
                                        updateEntry(metric.id, 'forecast', e.target.value)
                                      }
                                      className="h-8 w-20"
                                      placeholder="Forecast"
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="space-y-1">
                                      <Textarea
                                        value={entry.recover_activity}
                                        onChange={(e) =>
                                          updateEntry(metric.id, 'recover_activity', e.target.value)
                                        }
                                        className="h-16 text-xs"
                                        placeholder="Recovery plan..."
                                      />
                                      <Input
                                        type="text"
                                        value={entry.recovery_month}
                                        onChange={(e) =>
                                          updateEntry(metric.id, 'recovery_month', e.target.value)
                                        }
                                        className="h-7 text-xs"
                                        placeholder="Recovery month"
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                ))}

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Data'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Historical Data Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historical KPI Data</CardTitle>
                  <CardDescription>All entered data for this department</CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <Skeleton className="h-40 w-full" />
                    </div>
                  ) : historicalData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No historical data found
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[calc(100vh-400px)]">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-3">Year</th>
                            <th className="text-left py-2 px-3">Month</th>
                            <th className="text-left py-2 px-3">Measurement</th>
                            <th className="text-center py-2 px-3">Target</th>
                            <th className="text-center py-2 px-3">Result</th>
                            <th className="text-center py-2 px-3">Accu. Target</th>
                            <th className="text-center py-2 px-3">Accu. Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {historicalData.map((row, i) => (
                            <tr key={i} className="hover:bg-muted/30">
                              <td className="py-2 px-3">{row.year}</td>
                              <td className="py-2 px-3">{MONTHS[row.month - 1]}</td>
                              <td className="py-2 px-3">{row.measurement}</td>
                              <td className="py-2 px-3 text-center text-blue-600">{row.target}</td>
                              <td className="py-2 px-3 text-center text-green-600">{row.result}</td>
                              <td className="py-2 px-3 text-center text-blue-600">{row.accu_target}</td>
                              <td className="py-2 px-3 text-center text-green-600">{row.accu_result}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* No Metrics Available */}
        {!loading && !error && selectedDepartment && subCategoriesWithMetrics.size === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Indicators Available</h3>
              <p className="text-gray-500">
                No KPI indicators found for this department in the {categoryConfig?.name_en}{' '}
                category
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ShellLayout>
  );
};

export default KPIDataEntry;
