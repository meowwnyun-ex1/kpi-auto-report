import { useState, useEffect, useRef } from 'react';
import { AppService } from '@/services/api-service';
import { useRefresh } from '@/contexts/RefreshContext';
import { Application } from '@/shared/types';

// App status constants
export const APP_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

interface AppsResponse {
  applications: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search?: string;
    category_id?: number;
    sortBy: string;
    sortOrder: string;
  };
}

export const useApps = (filters?: {
  category_id?: number;
  search?: string;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshKey } = useRefresh();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchApps = async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number | boolean> = {};

      if (filters?.status) {
        params.status = filters.status;
      } else {
        params.status = APP_STATUS.APPROVED;
      }

      if (filters?.category_id !== undefined) {
        params.category_id = filters.category_id;
      }

      if (filters?.search) {
        params.search = filters.search;
      }

      if (filters?.limit) {
        params.limit = filters.limit;
      }

      if (filters?.sortBy) {
        params.sortBy = filters.sortBy;
      }

      if (filters?.sortOrder) {
        params.sortOrder = filters.sortOrder;
      }

      const data = (await AppService.getApps(params)) as AppsResponse;

      // Only update state if request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setApps(data.applications || []);
      }
    } catch (err) {
      // Don't treat abort as an error
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (import.meta.env.DEV) console.error('useApps: Error fetching apps:', errorMessage);

      // Only update error state if request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setError(errorMessage);

        // Implement exponential backoff retry for rate limiting
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
          const delay = Math.min(1000 * Math.pow(2, Math.floor(Math.random() * 3)), 8000);
          retryTimeoutRef.current = setTimeout(() => {
            fetchApps();
          }, delay);
        }
      }
    } finally {
      // Only update loading state if request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchApps();
  }, [
    filters?.category_id,
    filters?.search,
    filters?.limit,
    filters?.status,
    filters?.sortBy,
    filters?.sortOrder,
    refreshKey,
  ]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { apps, loading, error, refetch: fetchApps };
};
