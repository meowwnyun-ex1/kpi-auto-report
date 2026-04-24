import { useCallback } from 'react';
import { storage } from '@/shared/utils';
import { Category } from './types';

export const useCalculateTotalTargetValues = (categories: Category[]) =>
  useCallback(
    async (
      dept: string,
      fiscalYear: string
    ): Promise<{ values: Record<string, number>; counts: Record<string, number> }> => {
      if (!dept || !fiscalYear || categories.length === 0) return { values: {}, counts: {} };

      try {
        const response = await fetch(`/api/kpi-forms/yearly/${dept}/${fiscalYear}`, {
          headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
        });
        const data = await response.json();

        if (data.success && data.data) {
          // Group targets by category and sum their total_target values
          const categoryTargets: Record<string, number> = {};
          const categoryCounts: Record<string, number> = {};
          data.data.forEach((target: any) => {
            const categoryKey = categories.find((cat) => cat.id === target.category_id)?.key;
            if (categoryKey) {
              categoryTargets[categoryKey] =
                (categoryTargets[categoryKey] || 0) + (target.total_target || 0);
              categoryCounts[categoryKey] = (categoryCounts[categoryKey] || 0) + 1;
            }
          });

          console.log('Category targets calculated:', categoryTargets);
          console.log('Category counts calculated:', categoryCounts);
          return { values: categoryTargets, counts: categoryCounts };
        } else {
          console.log('No data or failed request:', data);
        }
      } catch (error) {
        console.error('Failed to calculate total target values:', error);
      }

      return { values: {}, counts: {} };
    },
    [categories]
  );
