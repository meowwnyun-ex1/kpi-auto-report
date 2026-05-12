/**
 * Monthly Targets V (Current Version)
 * NEW STRUCTURE:
 * 1. Show KPI Categories (Main Topics) first
 * 2. Click Category to see available Yearly Targets for allocation
 * 3. Filter/Allocate by Department
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  Save,
  Send,
  Trash2,
  CalendarDays,
  ChevronRight,
  Filter,
  Search,
  Eye,
  ArrowLeft,
  Building2,
  FolderOpen,
  CheckCircle,
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

interface YearlyTarget {
  id: number;
  kpi_name: string;
  target_value: number;
  remaining_pool: number;
  unit: string;
  main_department_id: number;
  main_department_name: string;
  related_department_ids: string;
  category_name: string;
  category_color: string;
}

interface MonthlyTarget {
  id: number;
  yearly_target_id: number;
  kpi_name: string;
  category_name: string;
  category_color: string;
  month: number;
  year: number;
  allocated_value: number;
  unit: string;
  status: string;
  department_name: string;
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

const MonthlyTargetsVPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableTargets, setAvailableTargets] = useState<YearlyTarget[]>([]);
  const [myTargets, setMyTargets] = useState<MonthlyTarget[]>([]);

  // View state
  const [viewMode, setViewMode] = useState<
    'categories' | 'category-detail' | 'my-allocations' | 'create'
  >('categories');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Pool allocation
  const [selectedTarget, setSelectedTarget] = useState<YearlyTarget | null>(null);
  const [allocateValue, setAllocateValue] = useState('');
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data in parallel for faster loading
  useEffect(() => {
    Promise.all([
      fetchCategories(),
      fetchDepartments(),
      fetchAvailableTargets(),
      fetchMyTargets(),
    ]).catch((error) => {
      // Errors handled individually in each function
    });
  }, [fiscalYear]);

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

  const fetchAvailableTargets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/kpi-forms/monthly/available-yearly', {
        params: { year: fiscalYear },
      });
      if (response.data.success) setAvailableTargets(response.data.data);
    } catch (error: any) {
      // Auth errors handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTargets = async () => {
    try {
      const response = await api.get('/kpi-forms/monthly', {
        params: { year: fiscalYear },
      });
      if (response.data.success) setMyTargets(response.data.data);
    } catch (error: any) {
      // Auth errors handled by AuthContext
    }
  };

  // Get targets grouped by category
  const getTargetsByCategory = () => {
    const grouped: Record<string, { category: Category; targets: YearlyTarget[] }> = {};

    categories.forEach((cat) => {
      grouped[cat.name] = { category: cat, targets: [] };
    });

    availableTargets.forEach((t) => {
      if (grouped[t.category_name]) {
        grouped[t.category_name].targets.push(t);
      } else {
        // Create category entry if not exists
        grouped[t.category_name] = {
          category: { id: 0, name: t.category_name, color: t.category_color },
          targets: [t],
        };
      }
    });

    return Object.values(grouped);
  };

  // Get departments involved in a category
  const getDepartmentsForCategory = (categoryName: string) => {
    const categoryTargets = availableTargets.filter((t) => t.category_name === categoryName);
    const deptIds = new Set<number>();

    categoryTargets.forEach((t) => {
      deptIds.add(t.main_department_id);
      t.related_department_ids?.split(',').forEach((id) => {
        if (id) deptIds.add(parseInt(id));
      });
    });

    return departments.filter((d) => deptIds.has(d.id));
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setViewMode('category-detail');
    setDepartmentFilter('all');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setViewMode('categories');
  };

  const handleOpenAllocate = (target: YearlyTarget) => {
    if (target.remaining_pool <= 0) {
      toast({
        title: 'Pool Exhausted',
        description: 'No remaining pool available',
        variant: 'destructive',
      });
      return;
    }
    setSelectedTarget(target);
    setAllocateValue('');
    setShowAllocateDialog(true);
  };

  const handleAllocate = async () => {
    if (!selectedTarget || !selectedMonth || !allocateValue) return;

    const value = parseFloat(allocateValue);
    if (value <= 0 || value > selectedTarget.remaining_pool) {
      toast({
        title: 'Invalid Value',
        description: `Maximum: ${selectedTarget.remaining_pool}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.post('/kpi-forms/monthly/allocate', {
        yearly_target_id: selectedTarget.id,
        department_id: user?.department_id,
        month: selectedMonth,
        year: fiscalYear,
        allocated_value: value,
      });

      toast({
        title: 'Allocated',
        description: `Allocated ${value} to ${MONTH_NAMES[selectedMonth - 1]}`,
      });
      setShowAllocateDialog(false);
      fetchAvailableTargets();
      fetchMyTargets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to allocate',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      pending: 'bg-amber-100 text-amber-600',
      hod_approved: 'bg-blue-100 text-blue-600',
      hos_approved: 'bg-purple-100 text-purple-600',
      approved: 'bg-green-100 text-green-600',
      rejected: 'bg-red-100 text-red-600',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  // RENDER: Categories List View
  const renderCategoriesView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">KPI Categories</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a category to allocate monthly targets
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getTargetsByCategory().map(({ category, targets }) => {
            const involvedDepts = getDepartmentsForCategory(category.name);
            const totalPool = targets.reduce((sum, t) => sum + t.remaining_pool, 0);

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
                        {targets.length} target{targets.length !== 1 ? 's' : ''} • {totalPool}{' '}
                        remaining pool
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {involvedDepts.slice(0, 4).map((dept) => (
                          <Badge key={dept.id} variant="outline" className="text-xs">
                            {dept.code}
                          </Badge>
                        ))}
                        {involvedDepts.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{involvedDepts.length - 4}
                          </Badge>
                        )}
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

  // RENDER: Category Detail with Pool Allocation
  const renderCategoryDetailView = () => {
    if (!selectedCategory) return null;

    const categoryTargets = availableTargets.filter((t) =>
      departmentFilter === 'all'
        ? t.category_name === selectedCategory.name
        : t.category_name === selectedCategory.name &&
          (t.main_department_id.toString() === departmentFilter ||
            t.related_department_ids?.includes(departmentFilter))
    );

    const involvedDepts = getDepartmentsForCategory(selectedCategory.name);

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
              <p className="text-sm text-gray-500">Pool Allocation</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <DepartmentSelector
                value={departmentFilter === 'all' ? '' : departmentFilter}
                onChange={(value) => setDepartmentFilter(value || 'all')}
                label="Department"
                placeholder="All Departments"
                showKpiOnly={true}
                restrictToUserDept={true}
              />

              <div className="flex-1" />

              <Select
                value={selectedMonth?.toString() || ''}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-40">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select Month" />
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
          </CardContent>
        </Card>

        {/* Targets for Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Available Targets ({categoryTargets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryTargets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No targets available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categoryTargets.map((target) => (
                  <div key={target.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{target.kpi_name}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span>
                            Pool: {target.target_value} {target.unit}
                          </span>
                          <span>•</span>
                          <span
                            className={cn(
                              'font-medium',
                              target.remaining_pool > 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                            Remaining: {target.remaining_pool} {target.unit}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOpenAllocate(target)}
                        disabled={!selectedMonth || target.remaining_pool <= 0}>
                        <Plus className="w-4 h-4 mr-2" />
                        Allocate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allocate Dialog */}
        <Dialog open={showAllocateDialog} onOpenChange={setShowAllocateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Allocate for {selectedMonth && MONTH_NAMES[selectedMonth - 1]}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedTarget && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{selectedTarget.kpi_name}</p>
                  <p className="text-sm text-gray-500">
                    Remaining Pool: {selectedTarget.remaining_pool} {selectedTarget.unit}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">Allocation Amount</label>
                <Input
                  type="number"
                  value={allocateValue}
                  onChange={(e) => setAllocateValue(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAllocateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAllocate} disabled={!allocateValue}>
                Allocate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // RENDER: My Allocations
  const renderMyAllocationsView = () => (
    <Card>
      <CardHeader>
        <CardTitle>My Monthly Allocations</CardTitle>
      </CardHeader>
      <CardContent>
        {myTargets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No allocations yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myTargets.map((target) => (
              <div
                key={target.id}
                className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: target.category_color }}
                  />
                  <div>
                    <p className="font-medium">{target.kpi_name}</p>
                    <p className="text-sm text-gray-500">
                      {MONTH_NAMES[target.month - 1]} {target.year} • {target.allocated_value}{' '}
                      {target.unit}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusBadge(target.status)}>
                  {target.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <ModernShellLayout>
      <ModernPageLayout
        title="Monthly Targets"
        icon={Target}
        iconColor="text-blue-600"
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
            variant={viewMode === 'my-allocations' ? 'default' : 'outline'}
            onClick={() => setViewMode('my-allocations')}>
            <CalendarDays className="w-4 h-4 mr-2" />
            My Allocations ({myTargets.length})
          </Button>
        </div>

        {/* Views */}
        {viewMode === 'categories' && renderCategoriesView()}
        {viewMode === 'category-detail' && renderCategoryDetailView()}
        {viewMode === 'my-allocations' && renderMyAllocationsView()}
      </ModernPageLayout>
    </ModernShellLayout>
  );
};

export default MonthlyTargetsVPage;
