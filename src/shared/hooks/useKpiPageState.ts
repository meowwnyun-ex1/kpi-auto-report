import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { storage } from '@/shared/utils';
import { Category } from '@/pages/kpi/shared';

/**
 * Standard hook for KPI page state management
 * Provides consistent behavior across all KPI pages
 */
export function useKpiPageState() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Common state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [loading, setLoading] = useState(false);
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

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/kpi-forms/departments', {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load departments',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Initialize
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reset category when department changes
  const handleDepartmentChange = useCallback((dept: string) => {
    setSelectedDept(dept);
    setSelectedCategory(''); // Reset category when department changes
  }, []);

  // Reset category when fiscal year changes
  const handleFiscalYearChange = useCallback((year: number) => {
    setSelectedCategory(''); // Reset category when year changes
  }, []);

  return {
    // State
    user,
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedDept,
    setSelectedDept,
    loading,
    setLoading,
    searchQuery,
    setSearchQuery,

    // Actions
    fetchCategories,
    fetchDepartments,
    handleDepartmentChange,
    handleFiscalYearChange,
  };
}
