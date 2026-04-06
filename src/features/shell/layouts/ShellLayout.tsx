import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import ContactWidget from '@/components/features/ContactWidget';
import { AppHeader } from '@/features/shell/header/AppHeader';
import { AppSidebar } from '@/features/shell/sidebar/AppSidebar';
import type { LayoutVariant } from '@/features/shell/shell-types';

export type { LayoutVariant };

export interface ShellLayoutProps {
  children?: React.ReactNode;
  /**
   * Layout variant: 'user' for regular pages, 'admin' for admin pages, 'minimal' for login/auth
   * @default 'user'
   */
  variant?: LayoutVariant;
  breadcrumbExtra?: string;
  showSidebar?: boolean;
  showContactWidget?: boolean;
  showStats?: boolean;
  showHeader?: boolean;
  headerContent?: React.ReactNode;
  className?: string;
}

const shellBackground: Record<LayoutVariant, string> = {
  user: [
    'bg-gradient-to-b from-sky-50/90 via-white to-pink-50/50',
    'bg-[radial-gradient(ellipse_90%_50%_at_50%_-15%,rgba(186,230,253,0.45),transparent_55%)]',
    'bg-[radial-gradient(ellipse_70%_40%_at_100%_0%,rgba(251,207,232,0.25),transparent_50%)]',
  ].join(' '),
  public: [
    'bg-gradient-to-b from-sky-50/90 via-white to-pink-50/50',
    'bg-[radial-gradient(ellipse_90%_50%_at_50%_-15%,rgba(186,230,253,0.45),transparent_55%)]',
    'bg-[radial-gradient(ellipse_70%_40%_at_100%_0%,rgba(251,207,232,0.25),transparent_50%)]',
  ].join(' '),
  admin: 'bg-slate-100/90',
  minimal: 'bg-slate-50',
};

/**
 * Unified ShellLayout - Single layout component for ALL pages.
 *
 * Usage:
 * - User pages: <ShellLayout variant="user" showContactWidget showStats />
 * - Admin pages: <ShellLayout variant="admin" showStats />
 * - Login/Auth: <ShellLayout variant="minimal" showSidebar={false} showHeader={false} />
 */
export const ShellLayout: React.FC<ShellLayoutProps> = ({
  children,
  variant = 'user',
  breadcrumbExtra,
  showSidebar,
  showContactWidget,
  showStats,
  showHeader,
  headerContent,
  className = '',
}) => {
  // Smart defaults based on variant
  const isMinimal = variant === 'minimal';

  const effectiveShowSidebar = showSidebar ?? !isMinimal;
  const effectiveShowContactWidget = showContactWidget ?? !isMinimal;
  const effectiveShowStats = showStats ?? !isMinimal;
  const effectiveShowHeader = showHeader ?? !isMinimal;

  const showNavToggle = Boolean(effectiveShowSidebar);
  const mainPaddingClass = isMinimal
    ? 'min-h-0 flex-1 p-0'
    : 'min-h-0 flex-1 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-6 sm:pt-5 md:px-6';

  return (
    <div
      className={`flex h-[100dvh] flex-col overflow-hidden ${shellBackground[variant]} ${className}`}>
      <SidebarProvider>
        <div className="flex min-h-0 w-full flex-1 overflow-hidden">
          {effectiveShowSidebar && <AppSidebar />}

          <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden border-0 bg-transparent p-0 shadow-none">
            {effectiveShowHeader && (
              <AppHeader
                variant={variant}
                breadcrumbExtra={breadcrumbExtra}
                showNavToggle={showNavToggle}
                showStats={effectiveShowStats}
                headerContent={headerContent}
              />
            )}

            <div className={`${mainPaddingClass}`}>{children || <Outlet />}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      {effectiveShowContactWidget && <ContactWidget />}
    </div>
  );
};

export default ShellLayout;
