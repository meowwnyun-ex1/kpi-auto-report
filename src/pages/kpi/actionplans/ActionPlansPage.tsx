import React from 'react';
import { ShellLayout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYearSelector } from '@/contexts/FiscalYearContext';
import { useActionPlansData } from './useActionPlansData';
import { Shield, RefreshCw, AlertCircle, GanttChart } from 'lucide-react';
import { CategorySelector } from '@/components/kpi/CategorySelector';
import { DeptYearSelector } from '@/components/kpi/DeptYearSelector';
import { ActionPlansTable } from './ActionPlansTable';
import { GanttChartView } from './GanttChartView';
import { SavedPlansTable } from './SavedPlansTable';
import { CATEGORY_CONFIG, STATUS_OPTIONS, ActionPlan } from './ActionPlansTypes';

export default function ActionPlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();

  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedDept,
    setSelectedDept,
    actionPlans,
    setActionPlans,
    savedPlans,
    employees,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    isFormReady,
    saveActionPlans,
    handleDepartmentChange,
    handleFiscalYearChange,
  } = useActionPlansData(fiscalYear, setFiscalYear);

  const canEdit = !!(user?.role && ['manager', 'admin', 'superadmin'].includes(user.role));

  const updatePlan = (index: number, field: keyof ActionPlan, value: string | number) => {
    const updatedPlans = [...actionPlans];
    updatedPlans[index] = { ...updatedPlans[index], [field]: value };
    setActionPlans(updatedPlans);
  };

  const addPlan = () => {
    setActionPlans([...actionPlans, createEmptyPlan()]);
  };

  const removePlan = (index: number) => {
    const updatedPlans = actionPlans.filter((_, i) => i !== index);
    setActionPlans(updatedPlans.length > 0 ? updatedPlans : [createEmptyPlan()]);
  };

  const saveData = async () => {
    const validPlans = actionPlans.filter(
      (plan) => plan.key_action && plan.start_month && plan.end_month && plan.person_in_charge
    );
    await saveActionPlans(validPlans);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delayed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 20) return 'bg-yellow-500';
    return 'bg-red-500';
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

  return (
    <ShellLayout>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Action Plans</h1>
          </div>

          {/* Step 1: Category Selection */}
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {/* Step 2: Department & Year */}
          <DeptYearSelector
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            selectedYear={fiscalYear}
            setSelectedYear={setFiscalYear}
            selectedCategory={selectedCategory}
          />

          {/* Step 3: Data Entry */}
          {isFormReady && (
            <ActionPlansTable
              actionPlans={actionPlans}
              canEdit={canEdit}
              saving={saving}
              onSave={saveData}
              onUpdatePlan={updatePlan}
              onRemovePlan={removePlan}
              CategoryIcon={CATEGORY_CONFIG[selectedCategory]?.icon}
              categoryColor={CATEGORY_CONFIG[selectedCategory]?.color}
              validPlansCount={
                actionPlans.filter(
                  (plan) =>
                    plan.key_action && plan.start_month && plan.end_month && plan.person_in_charge
                ).length
              }
              loading={loading}
              employees={employees}
            />
          )}

          {/* Gantt Chart */}
          {isFormReady && actionPlans.length > 0 && (
            <GanttChartView
              validPlans={actionPlans.filter(
                (plan) =>
                  plan.key_action && plan.start_month && plan.end_month && plan.person_in_charge
              )}
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
              CategoryIcon={CATEGORY_CONFIG[selectedCategory]?.icon}
            />
          )}
        </CardContent>
      </Card>
    </ShellLayout>
  );
}
