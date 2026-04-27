import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/shared/hooks/use-toast';
import { storage } from '@/shared/utils';

/**
 * Standard hook for KPI data fetching and management
 * Provides consistent API calls across all KPI pages
 */
export function useKpiData() {
  const { toast } = useToast();

  // Fetch stats for dashboard
  const fetchStats = useCallback(
    async (dept: string, fiscalYear: number) => {
      try {
        const response = await fetch(`/api/kpi-forms/stats/${dept}/${fiscalYear}`, {
          headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load statistics',
          variant: 'destructive',
        });
        return {};
      }
    },
    [toast]
  );

  // Fetch yearly targets
  const fetchYearlyTargets = useCallback(
    async (dept: string, fiscalYear: number, category?: string) => {
      try {
        const url = category
          ? `/api/kpi-forms/yearly/${dept}/${fiscalYear}?category=${category}`
          : `/api/kpi-forms/yearly/${dept}/${fiscalYear}`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to fetch yearly targets:', error);
        toast({
          title: 'Error',
          description: 'Failed to load yearly targets',
          variant: 'destructive',
        });
        return [];
      }
    },
    [toast]
  );

  // Fetch monthly targets
  const fetchMonthlyTargets = useCallback(
    async (dept: string, fiscalYear: number) => {
      try {
        const response = await fetch(`/api/kpi-forms/monthly/${dept}/${fiscalYear}`, {
          headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to fetch monthly targets:', error);
        toast({
          title: 'Error',
          description: 'Failed to load monthly targets',
          variant: 'destructive',
        });
        return [];
      }
    },
    [toast]
  );

  // Save yearly target
  const saveYearlyTarget = useCallback(
    async (targetData: any) => {
      try {
        const response = await fetch('/api/kpi-forms/yearly', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storage.getAuthToken()}`,
          },
          body: JSON.stringify(targetData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        toast({
          title: 'Success',
          description: 'Target saved successfully',
        });
        return data;
      } catch (error) {
        console.error('Failed to save yearly target:', error);
        toast({
          title: 'Error',
          description: 'Failed to save target',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  // Save monthly target
  const saveMonthlyTarget = useCallback(
    async (targetData: any) => {
      try {
        const response = await fetch('/api/kpi-forms/monthly', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storage.getAuthToken()}`,
          },
          body: JSON.stringify(targetData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        toast({
          title: 'Success',
          description: 'Monthly target saved successfully',
        });
        return data;
      } catch (error) {
        console.error('Failed to save monthly target:', error);
        toast({
          title: 'Error',
          description: 'Failed to save monthly target',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  // Save monthly result
  const saveMonthlyResult = useCallback(
    async (resultData: any) => {
      try {
        const response = await fetch('/api/kpi-forms/monthly/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storage.getAuthToken()}`,
          },
          body: JSON.stringify(resultData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        toast({
          title: 'Success',
          description: 'Monthly result saved successfully',
        });
        return data;
      } catch (error) {
        console.error('Failed to save monthly result:', error);
        toast({
          title: 'Error',
          description: 'Failed to save monthly result',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  return {
    fetchStats,
    fetchYearlyTargets,
    fetchMonthlyTargets,
    saveYearlyTarget,
    saveMonthlyTarget,
    saveMonthlyResult,
  };
}
