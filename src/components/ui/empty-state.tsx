import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  image?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'No Data Found',
  description = 'There is no data to display at the moment.',
  image = '/found.png',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative w-48 h-48 mb-6">
        <img
          src={image}
          alt="No data found"
          className="w-full h-full object-contain opacity-80"
          onError={(e) => {
            // Fallback if image doesn't exist
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
        {description}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Specific empty states for different scenarios
export function NoKPIData({ category }: { category?: string }) {
  return (
    <EmptyState
      title="No KPI Data"
      description={`No KPI data found${category ? ` for ${category}` : ''}. Please check if targets have been set for this period.`}
    />
  );
}

export function NoTargetsFound({ type = 'yearly' }: { type?: 'yearly' | 'monthly' }) {
  return (
    <EmptyState
      title={`No ${type === 'yearly' ? 'Yearly' : 'Monthly'} Targets`}
      description={`No ${type} targets have been set for this department and period. Please create targets first.`}
    />
  );
}

export function NoResultsFound() {
  return (
    <EmptyState
      title="No Results Found"
      description="No results have been entered for this period. Please enter the actual results."
    />
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <EmptyState
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
        action={
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Go to Dashboard
          </a>
        }
      />
    </div>
  );
}

export function ErrorPage({
  title = 'Something Went Wrong',
  description = 'An unexpected error occurred. Please try again later.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <EmptyState
        title={title}
        description={description}
        image="/404.png"
        action={
          onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Try Again
            </button>
          )
        }
      />
    </div>
  );
}
