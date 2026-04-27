import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { storage } from '@/shared/utils';
import { ActionPlan, Employee } from './ActionPlansTypes';

/**
 * Hook for Action Plans data management
 * Provides consistent API calls and state management
 */
export function useActionPlansData(fiscalYear?: number, setFiscalYear?: (year: number) => void) {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [savedPlans, setSavedPlans] = useState<ActionPlan[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/kpi-forms/categories', {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const response = await res.json();
      setCategories(response.data || response);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const response = await res.json();
      setEmployees(response.data || response);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Fetch action plans
  const fetchActionPlans = useCallback(async () => {
    if (!selectedDept || !fiscalYear || !selectedCategory) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/kpi-forms/action-plans/${selectedDept}/${fiscalYear}?category=${selectedCategory}`,
        { headers: { Authorization: `Bearer ${storage.getAuthToken()}` } }
      );
      const response = await res.json();
      setActionPlans(response.data || response);
    } catch (error) {
      console.error('Failed to fetch action plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load action plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDept, fiscalYear, selectedCategory, toast]);

  // Save action plans
  const saveActionPlans = useCallback(
    async (plans: ActionPlan[]) => {
      if (!selectedDept || !fiscalYear || !selectedCategory) return;

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
            fiscal_year: fiscalYear,
            plans: plans,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to save action plans');
        }

        toast({
          title: 'Success',
          description: 'Action plans saved successfully',
        });

        await fetchActionPlans();
      } catch (error) {
        console.error('Failed to save action plans:', error);
        toast({
          title: 'Error',
          description: 'Failed to save action plans',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    },
    [selectedDept, fiscalYear, selectedCategory, categories, toast, fetchActionPlans]
  );

  // Initialize
  useEffect(() => {
    fetchCategories();
    fetchEmployees();
  }, [fetchCategories, fetchEmployees]);

  // Load data when dependencies change
  useEffect(() => {
    if (selectedDept && fiscalYear && selectedCategory) {
      fetchActionPlans();
    }
  }, [selectedDept, fiscalYear, selectedCategory, fetchActionPlans]);

  // Handlers
  const handleDepartmentChange = (dept: string) => {
    setSelectedDept(dept);
    setSelectedCategory(''); // Reset category when department changes
  };

  const handleFiscalYearChange = (year: number) => {
    setFiscalYear?.(year);
    setSelectedCategory(''); // Reset category when year changes
  };

  const isFormReady = selectedCategory && selectedDept && fiscalYear;

  return {
    // State
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedDept,
    setSelectedDept,
    actionPlans,
    setActionPlans,
    savedPlans,
    setSavedPlans,
    employees,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    isFormReady,

    // Actions
    fetchCategories,
    fetchEmployees,
    fetchActionPlans,
    saveActionPlans,
    handleDepartmentChange,
    handleFiscalYearChange,
  };
}
