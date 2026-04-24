import React, { useState, useEffect, useMemo } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/shared/utils';
import {
  showSuccess,
  showError,
  createNotification,
  NotificationType,
  NotificationCategory,
} from '@/constants/notifications';
import { Shield, RefreshCw, AlertCircle, GanttChart } from 'lucide-react';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';
import { CategorySelector } from './CategorySelector';
import { DeptYearSelector } from './DeptYearSelector';
import { ActionPlansTable } from './ActionPlansTable';
import { GanttChartView } from './GanttChartView';
import { SavedPlansTable } from './SavedPlansTable';
import { Category, ActionPlan, CATEGORY_CONFIG, STATUS_OPTIONS } from './ActionPlansTypes';

export default function ActionPlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [employees, setEmployees] = useState<
    { employee_id: string; name_en: string; name_th?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const canEdit = user?.role && ['manager', 'admin', 'superadmin'].includes(user.role);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/admin/employees?limit=200', {
          headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
        });
        const data = await response.json();
        if (data.success) setEmployees(data.data);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  const isFormReady = selectedCategory && selectedDept && selectedYear;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isFormReady) fetchData();
  }, [selectedCategory, selectedDept, selectedYear]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/kpi-forms/categories');
      const data = await res.json();
      if (data.success)
        setCategories(
          data.data.map((c: any) => ({ ...c, color: CATEGORY_CONFIG[c.key]?.color || '#6B7280' }))
        );
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/kpi-forms/action-plans/${selectedDept}/${selectedYear}?category=${selectedCategory}`,
        { headers: { Authorization: `Bearer ${storage.getAuthToken()}` } }
      );
      const data = await res.json();
      if (data.success) setActionPlans(data.data.length > 0 ? data.data : [createEmptyPlan()]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmptyPlan = (): ActionPlan => ({
    category_id: categories.find((c) => c.key === selectedCategory)?.id || 0,
    key_action: '',
    action_plan: '',
    person_in_charge: '',
    start_month: 1,
    end_month: 12,
    status: 'Planned',
    progress: 0,
  });

  const addPlan = () => setActionPlans([...actionPlans, createEmptyPlan()]);

  const removePlan = (index: number) => setActionPlans(actionPlans.filter((_, i) => i !== index));

  const updatePlan = (index: number, field: keyof ActionPlan, value: string | number) => {
    const updated = [...actionPlans];
    updated[index][field] = value as never;
    setActionPlans(updated);
  };

  const saveData = async () => {
    if (!canEdit) {
      showError(toast, 'permission', 'action plans');
      return;
    }
    const validPlans = actionPlans.filter((p) => p.key_action);
    if (validPlans.length === 0) {
      toast(
        createNotification({
          type: 'error' as NotificationType,
          category: 'validation' as NotificationCategory,
          customTitle: 'No Data to Save',
          customDescription: 'Please enter at least one complete action plan before saving.',
        })
      );
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/kpi-forms/action-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify({
          department_id: selectedDept,
          category_id: categories.find((c) => c.key === selectedCategory)?.id,
          fiscal_year: selectedYear,
          plans: validPlans,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(toast, 'save', 'action plans');
        fetchData();
      } else {
        showError(toast, 'save', 'action plans', data.message);
      }
    } catch (error) {
      showError(toast, 'network');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status)?.color || 'bg-gray-300';

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const categoryConfig = selectedCategory ? CATEGORY_CONFIG[selectedCategory] : null;
  const CategoryIcon = categoryConfig?.icon || Shield;
  const validPlans = actionPlans.filter((p) => p.key_action);
  const completedCount = validPlans.filter((p) => p.status === 'Completed').length;
  const avgProgress =
    validPlans.length > 0
      ? Math.round(validPlans.reduce((sum, p) => sum + p.progress, 0) / validPlans.length)
      : 0;

  const savedPlans = useMemo(() => {
    const baseSaved = actionPlans.filter((p) => p.id);
    if (!searchQuery.trim()) return baseSaved;
    const query = searchQuery.toLowerCase();
    return baseSaved.filter(
      (plan) =>
        plan.key_action?.toLowerCase().includes(query) ||
        plan.action_plan?.toLowerCase().includes(query) ||
        plan.person_in_charge?.toLowerCase().includes(query) ||
        plan.status?.toLowerCase().includes(query)
    );
  }, [actionPlans, searchQuery]);

  return (
    <ShellLayout>
      <StandardPageLayout
        title="Action Plans"
        subtitle="Manage action plans and improvement initiatives"
        icon={GanttChart}
        iconColor="text-purple-600"
        onRefresh={fetchSavedPlans}
        loading={loading}
        theme="purple">
        <div className="space-y-6">
          {/* Step 1: Category Selection */}
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            loading={loading}
          />

          {/* Step 2: Dept & Year */}
          <DeptYearSelector
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedCategory={selectedCategory}
          />

          {/* Step 3: Data Entry */}
          {isFormReady && (
            <ActionPlansTable
              actionPlans={actionPlans}
              canEdit={!!canEdit}
              saving={saving}
              onSave={saveData}
              onUpdatePlan={updatePlan}
              onRemovePlan={removePlan}
              CategoryIcon={CategoryIcon}
              categoryColor={categoryConfig?.color}
              validPlansCount={validPlans.length}
              loading={loading}
              employees={employees}
            />
          )}

          {/* Gantt Chart */}
          {isFormReady && validPlans.length > 0 && (
            <GanttChartView
              validPlans={validPlans}
              getStatusColor={getStatusColor}
              getProgressColor={getProgressColor}
            />
          )}

          {/* Saved Plans */}
          {isFormReady && savedPlans.length > 0 && (
            <SavedPlansTable
              savedPlans={savedPlans}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAddPlan={addPlan}
              getStatusColor={getStatusColor}
              CategoryIcon={CategoryIcon}
            />
          )}

          {/* Instructions */}
          {!selectedCategory && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a KPI Category to Begin</h3>
                <p className="text-muted-foreground">
                  Choose a category, then select department and fiscal year to enter action plans
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </StandardPageLayout>
    </ShellLayout>
  );
}
