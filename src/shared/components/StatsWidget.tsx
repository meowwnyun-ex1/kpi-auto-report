import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYearSelector } from '@/contexts/FiscalYearContext';
import { getApiUrl } from '@/config/api';
import { Target, TrendingUp, CheckCircle, Calendar } from 'lucide-react';

interface StatsData {
  fiscalYear: number;
  availableYears: number[];
  totalTargets: number;
  targetsSet: number;
  monthlyEntries: number;
  resultsEntered: number;
  achievedTargets: number;
}

export function StatsWidget() {
  const { isAuthenticated, user } = useAuth();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();
  const isAdmin = isAuthenticated && user?.role === 'admin';

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = (await Promise.race([
        fetch(`${getApiUrl()}/stats?year=${fiscalYear}`, { signal: controller.signal }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
      ])) as Response;

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      const data = result.data || result;

      if (mountedRef.current) {
        setStats({
          fiscalYear: fiscalYear,
          availableYears: data.availableYears ?? [],
          totalTargets: data.totalTargets ?? 0,
          targetsSet: data.targetsSet ?? 0,
          monthlyEntries: data.monthlyEntries ?? 0,
          resultsEntered: data.resultsEntered ?? 0,
          achievedTargets: data.achievedTargets ?? 0,
        });
        // Available years are managed by the useFiscalYearSelector hook
        setLoading(false);
        retryCountRef.current = 0;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (mountedRef.current) {
        setLoading(false);
        // Auto-retry with backoff (max 3 retries)
        if (retryCountRef.current < 3) {
          retryCountRef.current += 1;
          const delay = retryCountRef.current * 3000;
          retryTimerRef.current = setTimeout(() => {
            if (mountedRef.current) fetchStats();
          }, delay);
        }
      }
    }
  }, [fiscalYear]);

  useEffect(() => {
    mountedRef.current = true;
    fetchStats();
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [fetchStats]);

  // Skeleton with shimmer animation
  if (loading && !stats) {
    return (
      <div className="flex items-center gap-2" role="status" aria-label="Loading">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="relative flex items-center gap-1.5 overflow-hidden rounded-full border border-pink-100/80 bg-sky-50/80 px-3 py-1.5">
            <div className="h-3.5 w-3.5 rounded-full bg-sky-200/80" />
            <div className="h-3 w-10 rounded bg-pink-100/90" />
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        ))}
      </div>
    );
  }

  // Build items - show fiscal year and key stats
  const items: Array<{
    icon: typeof Target;
    value: number;
    label: string;
    color: string;
    bg: string;
    border: string;
  }> = [
    {
      icon: Calendar,
      value: stats?.fiscalYear ?? new Date().getFullYear(),
      label: 'FY',
      color: 'text-blue-800',
      bg: 'bg-blue-50/95',
      border: 'border-blue-300/90',
    },
    {
      icon: Target,
      value: stats?.totalTargets ?? 0,
      label: 'Targets',
      color: 'text-sky-800',
      bg: 'bg-sky-50/95',
      border: 'border-sky-300/90',
    },
    {
      icon: CheckCircle,
      value: stats?.achievedTargets ?? 0,
      label: 'Achieved',
      color: 'text-green-800',
      bg: 'bg-green-50/95',
      border: 'border-green-300/90',
    },
  ];

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Statistics">
      {items.map(({ icon: Icon, value, label, color, bg, border }) => (
        <div
          key={label}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} border ${border} transition-all duration-200 hover:shadow-sm`}
          title={`${value.toLocaleString()} ${label}`}>
          <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} aria-hidden="true" />
          <span className={`text-xs font-bold ${color} tabular-nums leading-none`}>
            {label === 'FY' ? value : value.toLocaleString()}
          </span>
          <span className="hidden text-[11px] leading-none text-sky-600/70 sm:inline">{label}</span>
        </div>
      ))}
    </div>
  );
}
