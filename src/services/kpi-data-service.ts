/**
 * KPI Data Service
 * Centralized data management and API integration
 */

import type {
  KpiYearlyTarget,
  KpiMonthlyTarget,
  KpiMonthlyResult,
} from '@/shared/types/unified-kpi';

// Type aliases for backward compatibility
export type YearlyTargetData = KpiYearlyTarget;
export type MonthlyTargetData = KpiMonthlyTarget;
export type ResultData = KpiMonthlyResult;

export interface KpiRecord {
  id: number;
  category: string;
  measurement: string;
  unit: string;
  targetValue: number;
  status: string;
  department: string;
  fiscalYear: number;
}

// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3007/api';

// ============================================
// INTERFACES
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================
// DATA SERVICE CLASS
// ============================================

class KpiDataService {
  private cache: Map<string, any> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  // ============================================
  // UTILITY METHODS
  // ============================================

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramString}`;
  }

  private isCacheValid(cachedData: any): boolean {
    return cachedData && Date.now() - cachedData.timestamp < this.cacheTimeout;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    return this.isCacheValid(cached) ? cached.data : null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: Record<string, any>
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cachedData = this.getCache(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('authToken') || '',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result: ApiResponse<T> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      this.setCache(cacheKey, result.data);
      return result.data as T;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('API Request failed:', error);
      }
      throw error;
    }
  }

  // ============================================
  // YEARLY TARGETS
  // ============================================

  async getYearlyTargets(params?: {
    department?: string;
    fiscalYear?: number;
    status?: string;
  }): Promise<YearlyTargetData[]> {
    return this.request<YearlyTargetData[]>('/kpi-forms/yearly', {}, params);
  }

  async createYearlyTarget(data: Partial<YearlyTargetData>): Promise<YearlyTargetData> {
    const result = await this.request<YearlyTargetData>('/kpi-forms/yearly', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.clearCache('/kpi-forms/yearly'); // Clear cache after mutation
    return result;
  }

  async updateYearlyTarget(id: string, data: Partial<YearlyTargetData>): Promise<YearlyTargetData> {
    const result = await this.request<YearlyTargetData>(`/kpi-forms/yearly/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    this.clearCache('/kpi-forms/yearly');
    return result;
  }

  async approveYearlyTarget(id: string): Promise<YearlyTargetData> {
    const result = await this.request<YearlyTargetData>(`/kpi-forms/yearly/${id}/approve`, {
      method: 'POST',
    });
    this.clearCache('/kpi-forms/yearly');
    return result;
  }

  async rejectYearlyTarget(id: string, reason?: string): Promise<YearlyTargetData> {
    const result = await this.request<YearlyTargetData>(`/kpi-forms/yearly/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    this.clearCache('/kpi-forms/yearly');
    return result;
  }

  async fillAllMonths(yearlyTargetId: string): Promise<MonthlyTargetData[]> {
    const result = await this.request<MonthlyTargetData[]>(
      `/kpi-forms/yearly/${yearlyTargetId}/fill-months`,
      {
        method: 'POST',
      }
    );
    this.clearCache('/kpi-forms/monthly');
    return result;
  }

  // ============================================
  // MONTHLY TARGETS
  // ============================================

  async getMonthlyTargets(params?: {
    department?: string;
    fiscalYear?: number;
    month?: number;
    status?: string;
  }): Promise<MonthlyTargetData[]> {
    return this.request<MonthlyTargetData[]>('/kpi-forms/monthly', {}, params);
  }

  async createMonthlyTarget(data: Partial<MonthlyTargetData>): Promise<MonthlyTargetData> {
    const result = await this.request<MonthlyTargetData>('/kpi-forms/monthly', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.clearCache('/kpi-forms/monthly');
    return result;
  }

  async updateMonthlyTarget(
    id: string,
    data: Partial<MonthlyTargetData>
  ): Promise<MonthlyTargetData> {
    const result = await this.request<MonthlyTargetData>(`/kpi-forms/monthly/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    this.clearCache('/kpi-forms/monthly');
    return result;
  }

  async approveMonthlyTarget(id: string): Promise<MonthlyTargetData> {
    const result = await this.request<MonthlyTargetData>(`/kpi-forms/monthly/${id}/approve`, {
      method: 'POST',
    });
    this.clearCache('/kpi-forms/monthly');
    return result;
  }

  async rejectMonthlyTarget(id: string, reason?: string): Promise<MonthlyTargetData> {
    const result = await this.request<MonthlyTargetData>(`/kpi-forms/monthly/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    this.clearCache('/kpi-forms/monthly');
    return result;
  }

  // ============================================
  // RESULTS
  // ============================================

  async getResults(params?: {
    department?: string;
    fiscalYear?: number;
    month?: number;
    status?: string;
  }): Promise<ResultData[]> {
    return this.request<ResultData[]>('/kpi-forms/results', {}, params);
  }

  async createResult(data: Partial<ResultData>): Promise<ResultData> {
    const result = await this.request<ResultData>('/kpi-forms/results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.clearCache('/kpi-forms/results');
    return result;
  }

  async updateResult(id: string, data: Partial<ResultData>): Promise<ResultData> {
    const result = await this.request<ResultData>(`/kpi-forms/results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    this.clearCache('/kpi-forms/results');
    return result;
  }

  async submitResult(id: string): Promise<ResultData> {
    const result = await this.request<ResultData>(`/kpi-forms/results/${id}/submit`, {
      method: 'POST',
    });
    this.clearCache('/kpi-forms/results');
    return result;
  }

  async declareResult(id: string, reason: string, files?: File[]): Promise<ResultData> {
    const formData = new FormData();
    formData.append('reason', reason);

    if (files) {
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    }

    const result = await this.request<ResultData>(`/kpi-forms/results/${id}/declare`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
    this.clearCache('/kpi-forms/results');
    return result;
  }

  async verifyResult(id: string, verified: boolean): Promise<ResultData> {
    const result = await this.request<ResultData>(`/kpi-forms/results/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ verified }),
    });
    this.clearCache('/kpi-forms/results');
    return result;
  }

  // ============================================
  // CATEGORIES & DEPARTMENTS
  // ============================================

  async getCategories(): Promise<Array<{ id: number; name: string; key: string }>> {
    return this.request<Array<{ id: number; name: string; key: string }>>('/kpi-forms/categories');
  }

  async getDepartments(): Promise<Array<{ id: string; name: string; code: string }>> {
    return this.request<Array<{ id: string; name: string; code: string }>>('/departments');
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  clearCache(pattern?: string): void {
    if (pattern) {
      // Clear cache entries matching pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  // ============================================
  // REAL-TIME UPDATES
  // ============================================

  subscribeToUpdates(callback: (data: any) => void): () => void {
    const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/realtime`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);

        // Clear relevant cache on real-time updates
        this.clearCache();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('WebSocket message error:', error);
        }
      }
    };

    ws.onerror = (error) => {
      if (import.meta.env.DEV) {
        console.error('WebSocket error:', error);
      }
    };

    ws.onclose = () => {
      if (import.meta.env.DEV) {
        console.log('WebSocket connection closed');
      }
    };

    // Return unsubscribe function
    return () => {
      ws.close();
    };
  }

  // ============================================
  // EXPORT & REPORTING
  // ============================================

  async exportData(params: {
    type: 'yearly' | 'monthly' | 'results';
    format: 'excel' | 'pdf' | 'csv';
    filters?: Record<string, any>;
  }): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: localStorage.getItem('authToken') || '',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

export const kpiDataService = new KpiDataService();

// ============================================
// REACT HOOKS
// ============================================

import { useState, useEffect, useCallback } from 'react';

export function useYearlyTargets(params?: {
  department?: string;
  fiscalYear?: number;
  status?: string;
}) {
  const [data, setData] = useState<YearlyTargetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await kpiDataService.getYearlyTargets(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch yearly targets');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(async (data: Partial<YearlyTargetData>) => {
    try {
      const result = await kpiDataService.createYearlyTarget(data);
      setData((prev) => [...prev, result]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create yearly target');
      throw err;
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<YearlyTargetData>) => {
    try {
      const result = await kpiDataService.updateYearlyTarget(id, data);
      setData((prev) => prev.map((item) => (item.id === id ? result : item)));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update yearly target');
      throw err;
    }
  }, []);

  const approve = useCallback(async (id: string) => {
    try {
      const result = await kpiDataService.approveYearlyTarget(id);
      setData((prev) => prev.map((item) => (item.id === id ? result : item)));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve yearly target');
      throw err;
    }
  }, []);

  const reject = useCallback(async (id: string, reason?: string) => {
    try {
      const result = await kpiDataService.rejectYearlyTarget(id, reason);
      setData((prev) => prev.map((item) => (item.id === id ? result : item)));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject yearly target');
      throw err;
    }
  }, []);

  const fillAllMonths = useCallback(async (yearlyTargetId: string) => {
    try {
      const result = await kpiDataService.fillAllMonths(yearlyTargetId);
      // This would need to be handled by the monthly targets hook
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fill all months');
      throw err;
    }
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    approve,
    reject,
    fillAllMonths,
  };
}

export function useMonthlyTargets(params?: {
  department?: string;
  fiscalYear?: number;
  month?: number;
  status?: string;
}) {
  const [data, setData] = useState<MonthlyTargetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await kpiDataService.getMonthlyTargets(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monthly targets');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(async (data: Partial<MonthlyTargetData>) => {
    try {
      const result = await kpiDataService.createMonthlyTarget(data);
      setData((prev) => [...prev, result]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create monthly target');
      throw err;
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<MonthlyTargetData>) => {
    try {
      const result = await kpiDataService.updateMonthlyTarget(id, data);
      setData((prev) => prev.map((item) => (item.id === id ? result : item)));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update monthly target');
      throw err;
    }
  }, []);

  const approve = useCallback(async (id: string) => {
    try {
      const result = await kpiDataService.approveMonthlyTarget(id);
      setData((prev) => prev.map((item) => (item.id === id ? result : item)));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve monthly target');
      throw err;
    }
  }, []);

  const reject = useCallback(async (id: string, reason?: string) => {
    try {
      const result = await kpiDataService.rejectMonthlyTarget(id, reason);
      setData((prev) => prev.map((item) => (item.id === id ? result : item)));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject monthly target');
      throw err;
    }
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    approve,
    reject,
  };
}

export function useResults(params?: {
  department?: string;
  fiscalYear?: number;
  month?: number;
  status?: string;
}) {
  const [data, setData] = useState<ResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await kpiDataService.getResults(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(async (data: Partial<ResultData>) => {
    try {
      const result = await kpiDataService.createResult(data);
      setData((prev) => [...prev, result]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create result');
      throw err;
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<ResultData>) => {
    try {
      const result = await kpiDataService.updateResult(id, data);
      setData((prev) => prev.map((item) => (item.id === id ? result : item)));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update result');
      throw err;
    }
  }, []);

  const submit = useCallback(async (id: string) => {
    try {
      const result = await kpiDataService.submitResult(id);
      setData((prev) => prev.map((item) => (item.id === id ? result : item)));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit result');
      throw err;
    }
  }, []);

  const declare = useCallback(async (id: string, reason: string, files?: File[]) => {
    try {
      const result = await kpiDataService.declareResult(id, reason, files);
      setData((prev) => prev.map((item) => (item.id === id ? result : item)));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to declare result');
      throw err;
    }
  }, []);

  const verify = useCallback(async (id: string, verified: boolean) => {
    try {
      const result = await kpiDataService.verifyResult(id, verified);
      setData((prev) => prev.map((item) => (item.id === id ? result : item)));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify result');
      throw err;
    }
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    submit,
    declare,
    verify,
  };
}
