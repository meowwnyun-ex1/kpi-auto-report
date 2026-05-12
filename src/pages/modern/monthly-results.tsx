/**
 * Monthly Results V (Current Version)
 * NEW STRUCTURE:
 * 1. Show KPI Categories (Main Topics) first
 * 2. Click Category to see approved monthly targets for result entry
 * 3. Filter by Department
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Building2,
  FolderOpen,
  Plus,
  Eye,
  FileText,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYearSelector } from '@/contexts/FiscalYearContext';
import { ModernShellLayout, ModernPageLayout } from '@/components/layout/modern-layout';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/config/api';
import DepartmentSelector from '@/components/kpi/DepartmentSelector';

// ============================================
// TYPES
// ============================================

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Department {
  id: number;
  code: string;
  name: string;
}

interface ResultSource {
  id: number;
  code: string;
  name: string;
}

interface AvailableTarget {
  monthly_target_id: number;
  month: number;
  year: number;
  target_value: number;
  kpi_name: string;
  unit: string;
  category_name: string;
  category_color: string;
  department_name: string;
  result_id?: number;
  result_value?: number;
  result_status?: string;
}

interface MyResult {
  id: number;
  monthly_target_id: number;
  month: number;
  year: number;
  target_value: number;
  result_value: number;
  status: string;
  kpi_name: string;
  unit: string;
  category_name: string;
  category_color: string;
  department_name: string;
  declaration_reason?: string;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// ============================================
// COMPONENT
// ============================================

const MonthlyResultsVPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sources, setSources] = useState<ResultSource[]>([]);
  const [availableTargets, setAvailableTargets] = useState<AvailableTarget[]>([]);
  const [myResults, setMyResults] = useState<MyResult[]>([]);

  // View state
  const [viewMode, setViewMode] = useState<'categories' | 'category-detail' | 'my-results'>(
    'categories'
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Entry dialog
  const [selectedTarget, setSelectedTarget] = useState<AvailableTarget | null>(null);
  const [resultValue, setResultValue] = useState('');
  const [selectedSources, setSelectedSources] = useState<number[]>([]);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [declarationReason, setDeclarationReason] = useState('');
  const [showDeclareDialog, setShowDeclareDialog] = useState(false);

  // UI states
  const [loading, setLoading] = useState(true);

  // Fetch data in parallel for faster loading
  useEffect(() => {
    Promise.all([fetchCategories(), fetchDepartments(), fetchSources(), fetchMyResults()]).catch(
      (error) => {
        // Errors handled individually in each function
      }
    );
  }, [selectedMonth, fiscalYear]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/kpi-forms/yearly/categories');
      if (response.data.success) setCategories(response.data.data);
    } catch (error: any) {
      // Auth errors handled by AuthContext
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/kpi-forms/yearly/departments');
      if (response.data.success) setDepartments(response.data.data);
    } catch (error: any) {
      // Auth errors handled by AuthContext
    }
  };

  const fetchSources = async () => {
    try {
      const response = await api.get('/kpi-results/sources');
      if (response.data.success) setSources(response.data.data);
    } catch (error: any) {
      // Auth errors handled by AuthContext
    }
  };

  const fetchAvailableTargets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/kpi-results/available-targets', {
        params: { year: fiscalYear, month: selectedMonth },
      });
      if (response.data.success) setAvailableTargets(response.data.data);
    } catch (error: any) {
      // Auth errors handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResults = async () => {
    try {
      const response = await api.get('/kpi-results/my-results', {
        params: { year: fiscalYear, month: selectedMonth },
      });
      if (response.data.success) setMyResults(response.data.data);
    } catch (error: any) {
      // Auth errors handled by AuthContext
    }
  };

  // Get targets grouped by category
  const getTargetsByCategory = () => {
    const grouped: Record<string, { category: Category; targets: AvailableTarget[] }> = {};

    categories.forEach((cat) => {
      grouped[cat.name] = { category: cat, targets: [] };
    });

    availableTargets.forEach((t) => {
      if (grouped[t.category_name]) {
        grouped[t.category_name].targets.push(t);
      } else {
        grouped[t.category_name] = {
          category: { id: 0, name: t.category_name, color: t.category_color },
          targets: [t],
        };
      }
    });

    return Object.values(grouped).filter((g) => g.targets.length > 0);
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setViewMode('category-detail');
    fetchAvailableTargets();
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setViewMode('categories');
  };

  const handleOpenEntry = (target: AvailableTarget) => {
    setSelectedTarget(target);
    setResultValue(target.result_value?.toString() || '');
    setSelectedSources([]);
    setShowEntryDialog(true);
    if (target.result_id) {
      fetchResultSources(target.result_id);
    }
  };

  const fetchResultSources = async (resultId: number) => {
    try {
      const response = await api.get(`/kpi-results/${resultId}/sources`);
      if (response.data.success) {
        setSelectedSources(response.data.data.map((s: any) => s.source_id));
      }
    } catch (error: any) {
      // Auth errors handled by AuthContext
    }
  };

  const handleSourceToggle = (sourceId: number) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]
    );
  };

  const handleSaveResult = async () => {
    if (!selectedTarget) return;

    const value = parseFloat(resultValue);
    if (isNaN(value) || value < 0) {
      toast({
        title: 'Invalid Value',
        description: 'Please enter a valid number',
        variant: 'destructive',
      });
      return;
    }

    if (selectedSources.length !== value) {
      toast({
        title: 'Validation Error',
        description: `Sources (${selectedSources.length}) must match result (${value})`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.post('/kpi-results', {
        monthly_target_id: selectedTarget.monthly_target_id,
        result_value: value,
        source_ids: selectedSources,
      });

      if (response.data.data?.requires_declaration) {
        setShowEntryDialog(false);
        setShowDeclareDialog(true);
      } else {
        toast({ title: 'Saved', description: 'Result saved successfully' });
        setShowEntryDialog(false);
        fetchAvailableTargets();
        fetchMyResults();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitDeclaration = async () => {
    if (!selectedTarget?.result_id || !declarationReason) return;

    try {
      await api.post(`/kpi-results/${selectedTarget.result_id}/declare`, {
        declaration_reason: declarationReason,
      });

      toast({ title: 'Submitted', description: 'Declaration submitted for approval' });
      setShowDeclareDialog(false);
      setDeclarationReason('');
      fetchAvailableTargets();
      fetchMyResults();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit declaration',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      not_entered: 'bg-gray-100 text-gray-600',
      full_complete: 'bg-green-100 text-green-600',
      partial_complete: 'bg-amber-100 text-amber-600',
      pending_approval: 'bg-blue-100 text-blue-600',
      approved: 'bg-green-100 text-green-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  // RENDER: Categories List
  const renderCategoriesView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">KPI Categories</h2>
            <p className="text-sm text-gray-500 mt-1">Select a category to enter results</p>
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getTargetsByCategory().map(({ category, targets }) => {
              const enteredCount = targets.filter((t) => t.result_value !== undefined).length;

              return (
                <Card
                  key={category.name}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleSelectCategory(category)}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}>
                        <FolderOpen className="w-6 h-6" style={{ color: category.color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {targets.length} target{targets.length !== 1 ? 's' : ''} • {enteredCount}{' '}
                          entered
                        </p>

                        <div className="mt-3 flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {MONTH_NAMES[selectedMonth - 1]} {fiscalYear}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // RENDER: Category Detail with Result Entry
  const renderCategoryDetailView = () => {
    if (!selectedCategory) return null;

    const categoryTargets = availableTargets.filter(
      (t) =>
        t.category_name === selectedCategory.name &&
        (departmentFilter === 'all' || t.department_name.includes(departmentFilter))
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToCategories}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${selectedCategory.color}20` }}>
              <FolderOpen className="w-5 h-5" style={{ color: selectedCategory.color }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{selectedCategory.name}</h2>
              <p className="text-sm text-gray-500">
                {MONTH_NAMES[selectedMonth - 1]} {fiscalYear} • Result Entry
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <DepartmentSelector
              value={departmentFilter === 'all' ? '' : departmentFilter}
              onChange={(value) => setDepartmentFilter(value || 'all')}
              label="Filter by Department"
              placeholder="All Departments"
              showKpiOnly={true}
              restrictToUserDept={true}
            />
          </CardContent>
          <CardHeader>
            <CardTitle>Targets ({categoryTargets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryTargets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No targets available for this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categoryTargets.map((target) => (
                  <div key={target.monthly_target_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{target.kpi_name}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {target.department_name}
                          </span>
                          <span>
                            Target: {target.target_value} {target.unit}
                          </span>
                          {target.result_value !== undefined && (
                            <>
                              <span>•</span>
                              <span
                                className={cn(
                                  'font-medium',
                                  target.result_value === target.target_value
                                    ? 'text-green-600'
                                    : 'text-amber-600'
                                )}>
                                Result: {target.result_value}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant={target.result_value !== undefined ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleOpenEntry(target)}>
                        {target.result_value !== undefined ? (
                          <>
                            <Eye className="w-4 h-4 mr-1" /> Edit
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" /> Enter
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entry Dialog */}
        <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {selectedTarget?.result_value !== undefined ? 'Edit Result' : 'Enter Result'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedTarget && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{selectedTarget.kpi_name}</p>
                  <p className="text-sm text-gray-500">
                    Target: {selectedTarget.target_value} {selectedTarget.unit} •{' '}
                    {MONTH_NAMES[selectedMonth - 1]} {fiscalYear}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Result Value</label>
                <Input
                  type="number"
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  placeholder={`Enter result (${selectedTarget?.unit})`}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Source Locations ({resultValue || 0} sources needed)
                </label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {sources.map((source) => (
                      <label
                        key={source.id}
                        className={cn(
                          'flex items-center gap-2 cursor-pointer p-2 rounded transition-colors',
                          selectedSources.includes(source.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                        )}>
                        <Checkbox
                          checked={selectedSources.includes(source.id)}
                          onCheckedChange={() => handleSourceToggle(source.id)}
                        />
                        <span className="text-sm">{source.code}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEntryDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveResult}
                disabled={!resultValue || selectedSources.length !== parseInt(resultValue || '0')}>
                Save Result
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Declaration Dialog */}
        <Dialog open={showDeclareDialog} onOpenChange={setShowDeclareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Declaration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Partial Complete</span>
                </div>
                <p className="text-sm text-amber-700 mt-2">
                  Result does not match target. Please provide a reason.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Declaration Reason *</label>
                <Textarea
                  value={declarationReason}
                  onChange={(e) => setDeclarationReason(e.target.value)}
                  placeholder="Explain the variance..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeclareDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitDeclaration} disabled={!declarationReason.trim()}>
                Submit Declaration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // RENDER: My Results
  const renderMyResultsView = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>My Results</span>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No results entered yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${result.category_color}20` }}>
                          <Check className="w-4 h-4" style={{ color: result.category_color }} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{result.kpi_name}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span>
                              {MONTH_NAMES[result.month - 1]} {result.year}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {result.department_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 ml-11">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Result:</span>
                          <span className="font-medium text-gray-900">{result.result_value}</span>
                          <span className="text-sm text-gray-500">{result.unit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Target:</span>
                          <span className="font-medium text-gray-900">{result.target_value}</span>
                        </div>
                        <Badge className={getStatusBadge(result.status)}>
                          {result.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <ModernShellLayout>
      <ModernPageLayout
        title="Monthly Results"
        icon={BarChart3}
        iconColor="text-emerald-600"
        fiscalYear={fiscalYear}
        availableYears={availableYears}
        onFiscalYearChange={setFiscalYear}>
        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={viewMode === 'categories' ? 'default' : 'outline'}
            onClick={() => setViewMode('categories')}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Categories
          </Button>
          <Button
            variant={viewMode === 'my-results' ? 'default' : 'outline'}
            onClick={() => setViewMode('my-results')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            My Results ({myResults.length})
          </Button>
        </div>

        {/* Views */}
        {viewMode === 'categories' && renderCategoriesView()}
        {viewMode === 'category-detail' && renderCategoryDetailView()}
        {viewMode === 'my-results' && renderMyResultsView()}
      </ModernPageLayout>
    </ModernShellLayout>
  );
};

export default MonthlyResultsVPage;
