import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';

// ============================================
// Basic Skeleton Component
// ============================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-primary/10', className)} {...props} />;
}

// ============================================
// Loading Overlay
// ============================================

interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  text?: string;
  minDelay?: number;
}

export function LoadingOverlay({
  loading,
  children,
  text = 'Loading...',
  minDelay = 0,
}: LoadingOverlayProps) {
  const [showOverlay, setShowOverlay] = React.useState(false);
  const [minDelayPassed, setMinDelayPassed] = React.useState(true);

  React.useEffect(() => {
    if (loading) {
      setShowOverlay(true);
      setMinDelayPassed(false);

      if (minDelay > 0) {
        const timer = setTimeout(() => setMinDelayPassed(true), minDelay);
        return () => clearTimeout(timer);
      } else {
        setMinDelayPassed(true);
      }
    } else {
      // Small delay before hiding for smooth transition
      const timer = setTimeout(() => setShowOverlay(false), 150);
      return () => clearTimeout(timer);
    }
  }, [loading, minDelay]);

  return (
    <div className="relative">
      {/* Content with fade effect */}
      <div className={`transition-opacity duration-200 ${loading ? 'opacity-30' : 'opacity-100'}`}>
        {children}
      </div>

      {/* Loading overlay */}
      {showOverlay && minDelayPassed && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm transition-opacity duration-200">
          <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-lg border">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-gray-700">{text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton components for loading states
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-2 bg-gray-200 rounded w-full" />
        </div>
      ))}
    </>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 p-3 bg-muted/50 rounded">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3 border-b animate-pulse">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="flex-1 h-4 bg-gray-200 rounded"
              style={{ animationDelay: `${rowIndex * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageLoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      <span className="text-muted-foreground animate-pulse">{text}</span>
    </div>
  );
}

// Form field skeleton
export function FormFieldSkeleton({ label = true }: { label?: boolean }) {
  return (
    <div className="space-y-2 animate-pulse">
      {label && <div className="h-4 bg-gray-200 rounded w-24" />}
      <div className="h-10 bg-gray-200 rounded w-full" />
    </div>
  );
}

// Form skeleton for multiple fields
export function FormSkeleton({ fields = 4, columns = 1 }: { fields?: number; columns?: number }) {
  return (
    <div className={`grid gap-4 ${columns > 1 ? `grid-cols-${columns}` : ''} animate-pulse`}>
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
    </div>
  );
}

// KPI Card skeleton
export function KPICardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-gray-200 rounded w-16" />
        <div className="h-6 bg-gray-200 rounded w-20" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="flex items-center gap-2">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <div className="h-8 bg-gray-200 rounded" />
        <div className="h-8 bg-gray-200 rounded" />
        <div className="h-8 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// Stats card skeleton
export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-5 w-5 bg-gray-200 rounded-full" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
      <div className="h-3 bg-gray-200 rounded w-32" />
    </div>
  );
}

// Page header skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="h-4 bg-gray-200 rounded w-64" />
    </div>
  );
}

// Filter bar skeleton
export function FilterBarSkeleton({ filters = 3 }: { filters?: number }) {
  return (
    <div className="flex gap-3 animate-pulse">
      {Array.from({ length: filters }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-200 rounded w-40" />
      ))}
    </div>
  );
}

// Full page skeleton
export function PageSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeaderSkeleton />
      <FilterBarSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
