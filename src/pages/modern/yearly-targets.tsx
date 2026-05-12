/**
 * Yearly Targets - Main Structure
 * 1. Show KPI Categories (Main Topics) first
 * 2. Click Category to see targets
 * 3. Filter by Department to see involvement
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  Save,
  Send,
  Trash2,
  Edit3,
  CheckCircle,
  Clock,
  ArrowLeft,
  Building2,
  FolderOpen,
  ChevronRight,
  Filter,
  Search,
  Eye,
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
  sub_categories: { id: number; name: string }[];
}

interface Department {
  id: number;
  code: string;
  name: string;
}

interface Approver {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

interface YearlyTarget {
  id: number;
  category_id: number;
  category_name: string;
  category_color: string;
  sub_category_id?: number;
  sub_category_name?: string;
  kpi_name: string;
  kpi_type: 'New' | 'Existing';
  frequency: string;
  unit: string;
  target_value: number;
  main_department_id: number;
  main_department_name: string;
  related_department_ids?: string;
  year: number;
  status: string;
  is_draft: boolean;
  created_at: string;
  created_by_name?: string;
}

// ============================================
// COMPONENT
// ============================================

const YearlyTargetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [targets, setTargets] = useState<YearlyTarget[]>([]);
  const [myDrafts, setMyDrafts] = useState<YearlyTarget[]>([]);

  // View state
  const [viewMode, setViewMode] = useState<'categories' | 'category-detail' | 'create' | 'drafts'>(
    'categories'
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<number[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    category_id: '',
    sub_category_id: '',
    kpi_name: '',
    kpi_type: 'New' as 'New' | 'Existing',
    frequency: '1/Y',
    unit: '',
    target_value: '',
    main_department_id: '',
    related_department_ids: [] as string[],
    year: new Date().getFullYear().toString(),
  });

  // Fetch data in parallel for faster loading
  useEffect(() => {
    Promise.all([
      fetchCategories(),
      fetchDepartments(),
      fetchApprovers(),
      fetchAllTargets(),
      fetchMyDrafts(),
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

  const fetchApprovers = async () => {
    try {
      const response = await api.get('/kpi-forms/yearly/approvers');
      if (response.data.success) setApprovers(response.data.data);
    } catch (error: any) {
      // Auth errors handled by AuthContext
    }
  };

  const fetchAllTargets = async () => {
    try {
      setIsLoading(true);
      const params: any = { year: fiscalYear };
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await api.get('/kpi-forms/yearly', { params });
      if (response.data.success) setTargets(response.data.data);
    } catch (error: any) {
      // Auth errors handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyDrafts = async () => {
    try {
      const response = await api.get('/kpi-forms/yearly', { params: { status: 'my_drafts' } });
      if (response.data.success) setMyDrafts(response.data.data);
    } catch (error: any) {
      // Auth errors handled by AuthContext
    }
  };

  // Filter targets by category and department
  const getFilteredTargets = () => {
    return targets.filter((t) => {
      if (selectedCategory && t.category_id !== selectedCategory.id) return false;
      if (departmentFilter !== 'all') {
        const isMainDept = t.main_department_id.toString() === departmentFilter;
        const isRelatedDept = t.related_department_ids?.includes(departmentFilter);
        if (!isMainDept && !isRelatedDept) return false;
      }
      if (searchQuery && !t.kpi_name.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    });
  };

  // Get targets grouped by category for category view
  const getTargetsByCategory = () => {
    const grouped: Record<number, { category: Category; targets: YearlyTarget[] }> = {};

    categories.forEach((cat) => {
      grouped[cat.id] = { category: cat, targets: [] };
    });

    targets.forEach((t) => {
      if (grouped[t.category_id]) {
        grouped[t.category_id].targets.push(t);
      }
    });

    return Object.values(grouped);
  };

  // Get departments involved in a category
  const getDepartmentsForCategory = (categoryId: number) => {
    const categoryTargets = targets.filter((t) => t.category_id === categoryId);
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
    setDepartmentFilter('all');
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
      {/* Header with Year Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">KPI Categories</h2>
          <p className="text-sm text-gray-500 mt-1">Select a category to view targets</p>
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getTargetsByCategory().map(({ category, targets }) => {
            const involvedDepts = getDepartmentsForCategory(category.id);

            return (
              <Card
                key={category.id}
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
                        {targets.length} target{targets.length !== 1 ? 's' : ''}
                      </p>

                      {/* Departments involved */}
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

  // RENDER: Category Detail View with Department Filter
  const renderCategoryDetailView = () => {
    if (!selectedCategory) return null;

    const filteredTargets = getFilteredTargets();
    const involvedDepts = getDepartmentsForCategory(selectedCategory.id);

    return (
      <div className="space-y-6">
        {/* Back Button & Header */}
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
              <p className="text-sm text-gray-500">Yearly Targets</p>
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
                label="Filter by Department"
                placeholder="All Departments"
                showKpiOnly={true}
                restrictToUserDept={true}
              />

              <div className="flex-1" />

              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search KPI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Targets List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Targets ({filteredTargets.length})</span>
              {departmentFilter !== 'all' && (
                <Badge variant="outline">
                  Filtered by: {departments.find((d) => d.id.toString() === departmentFilter)?.code}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTargets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No targets found</p>
                {departmentFilter !== 'all' && (
                  <p className="text-sm mt-1">This department has no targets in this category</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTargets.map((target) => (
                  <div
                    key={target.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{target.kpi_name}</h4>
                          <Badge className={getStatusBadge(target.status)}>
                            {target.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {target.main_department_name}
                          </span>
                          <span>•</span>
                          <span>
                            {target.target_value} {target.unit}
                          </span>
                          <span>•</span>
                          <span>
                            {target.kpi_type} • {target.frequency}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/yearly-targets/${target.id}/approval-route`)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <ModernShellLayout>
      <ModernPageLayout
        title="Yearly Targets"
        icon={Target}
        iconColor="text-blue-600"
        fiscalYear={fiscalYear}
        availableYears={availableYears}
        onFiscalYearChange={setFiscalYear}>
        {/* Top Actions */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={viewMode === 'categories' ? 'default' : 'outline'}
            onClick={() => setViewMode('categories')}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Categories
          </Button>
          <Button
            variant={viewMode === 'drafts' ? 'default' : 'outline'}
            onClick={() => setViewMode('drafts')}>
            <Save className="w-4 h-4 mr-2" />
            My Drafts ({myDrafts.length})
          </Button>
          <Button
            variant={viewMode === 'create' ? 'default' : 'outline'}
            onClick={() => setViewMode('create')}
            className="ml-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Target
          </Button>
        </div>

        {/* Views */}
        {viewMode === 'categories' && renderCategoriesView()}
        {viewMode === 'category-detail' && renderCategoryDetailView()}
        {viewMode === 'drafts' && (
          <Card>
            <CardHeader>
              <CardTitle>My Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              {myDrafts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Save className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No drafts saved</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myDrafts.map((draft) => (
                    <div key={draft.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{draft.kpi_name}</p>
                          <p className="text-sm text-gray-500">
                            {draft.category_name} • {draft.target_value} {draft.unit}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {viewMode === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Target</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Create form will be implemented here...</p>
              <Button onClick={() => setViewMode('categories')} className="mt-4">
                Back to Categories
              </Button>
            </CardContent>
          </Card>
        )}
      </ModernPageLayout>
    </ModernShellLayout>
  );
};

export default YearlyTargetsPage;
