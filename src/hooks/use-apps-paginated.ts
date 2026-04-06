import { useState, useEffect, useCallback, useRef } from 'react';
import { AppService } from '@/services/api-service';

const PAGE_SIZE = 40;

type AppsResponse = {
  applications?: unknown[];
  data?: unknown[];
};

async function fetchAppsPage(offset: number) {
  const data = (await AppService.getApps({
    status: 'approved',
    limit: PAGE_SIZE,
    offset,
    sortBy: 'view_count',
    sortOrder: 'desc',
  })) as AppsResponse;
  return (data.applications ?? data.data ?? []) as any[];
}

/**
 * Loads approved apps in pages for infinite scroll (view_count desc).
 */
export function useAppsPaginated() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const fetchInFlight = useRef(false);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAppsPage(0);
      setApps(list);
      setHasMore(list.length === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load apps');
      setApps([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!hasMore || fetchInFlight.current) return;
    fetchInFlight.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const list = await fetchAppsPage(apps.length);
      setApps((prev) => [...prev, ...list]);
      setHasMore(list.length === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load more');
    } finally {
      fetchInFlight.current = false;
      setLoadingMore(false);
    }
  }, [apps.length, hasMore]);

  const refetch = useCallback(async () => {
    setApps([]);
    setHasMore(true);
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAppsPage(0);
      setApps(list);
      setHasMore(list.length === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load apps');
      setApps([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { apps, loading, loadingMore, error, hasMore, loadMore, refetch };
}
