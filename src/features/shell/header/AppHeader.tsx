import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb } from '@/components/features/Breadcrumb';
import { StatsWidget } from '@/components/features/Stats';
import type { LayoutVariant } from '@/features/shell/shell-types';

export interface AppHeaderProps {
  variant: LayoutVariant;
  breadcrumbExtra?: string;
  showNavToggle: boolean;
  showStats: boolean;
  headerContent?: React.ReactNode;
}

function breadcrumbVariantFor(v: LayoutVariant): 'admin' | 'user' {
  return v === 'admin' ? 'admin' : 'user';
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  variant,
  breadcrumbExtra,
  showNavToggle,
  showStats,
  headerContent,
}) => {
  const isMinimal = variant === 'minimal';

  if (isMinimal) {
    return (
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700">
          DENSO App Store
        </Link>
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
          Back to store
        </Link>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-4">
        {showNavToggle && (
          <SidebarTrigger
            aria-label="Toggle sidebar"
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:shadow-md">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
        )}

        <Breadcrumb
          variant={breadcrumbVariantFor(variant)}
          showIcons
          showBadges={false}
          compact
          extra={breadcrumbExtra}
        />
      </div>

      <div className="flex items-center gap-3">
        {showStats && <StatsWidget />}

        {headerContent}
      </div>
    </header>
  );
};
