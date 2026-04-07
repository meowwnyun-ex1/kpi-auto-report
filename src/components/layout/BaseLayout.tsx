import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb } from '@/components/features/Breadcrumb';
import { Menu } from 'lucide-react';
import { StatsWidget } from '@/components/features/Stats';

export type LayoutVariant = 'user' | 'admin' | 'public' | 'minimal';

export interface BaseLayoutProps {
  children?: React.ReactNode;
  variant?: LayoutVariant;
  breadcrumbExtra?: string;
  showSidebar?: boolean;
  showStats?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  headerContent?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  className?: string;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  variant = 'user',
  breadcrumbExtra,
  showSidebar = true,
  showStats = true,
  showHeader = true,
  showFooter = true,
  headerContent,
  sidebarContent,
  className = '',
}) => {
  // Determine breadcrumb variant based on layout variant
  const getBreadcrumbVariant = () => {
    switch (variant) {
      case 'admin':
        return 'admin';
      case 'user':
        return 'user';
      case 'public':
        return 'user';
      case 'minimal':
        return 'user';
      default:
        return 'user';
    }
  };

  // Determine if we should show the header
  const showHeaderComponent = showHeader && variant !== 'minimal';

  // Get background classes based on variant
  const getBackgroundClasses = () => {
    switch (variant) {
      case 'admin':
        return 'bg-gray-50';
      case 'user':
        return 'bg-gray-50';
      case 'public':
        return 'bg-gray-50';
      case 'minimal':
        return 'bg-white';
      default:
        return 'bg-gray-50';
    }
  };

  // Get main content padding classes
  const getMainPaddingClasses = () => {
    switch (variant) {
      case 'admin':
        return 'p-3 sm:p-4 md:p-5 bg-gray-50/30';
      case 'user':
        return 'p-3 sm:p-4 md:p-5 bg-gray-50/30';
      case 'public':
        return 'p-3 sm:p-4 md:p-5 bg-gray-50/30';
      case 'minimal':
        return 'p-4';
      default:
        return 'p-3 sm:p-4 md:p-5 bg-gray-50/30';
    }
  };

  return (
    <div className={`min-h-screen ${getBackgroundClasses()} flex flex-col ${className}`}>
      <SidebarProvider>
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {showSidebar && sidebarContent && (
            <div className="flex-shrink-0 h-screen sticky top-0">{sidebarContent}</div>
          )}

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 min-w-0 h-screen">
            {/* Header */}
            {showHeaderComponent && (
              <header className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center gap-2 sm:gap-3 bg-white/90 backdrop-blur-md justify-between border-b border-gray-200/60 px-2 sm:px-3 md:px-4 lg:px-6 shadow-sm overflow-hidden">
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0 flex-1">
                  {showSidebar && variant !== 'admin' && (
                    <>
                      <SidebarTrigger
                        aria-label="Toggle sidebar"
                        className="flex-shrink-0 hover:bg-gray-100 rounded-lg transition-all duration-200 p-2">
                        <Menu className="h-4 w-4" />
                      </SidebarTrigger>
                      <Separator
                        orientation="vertical"
                        className="mx-1 sm:mx-2 data-[orientation=vertical]:h-4 flex-shrink-0 hidden sm:block"
                      />
                    </>
                  )}

                  {/* Breadcrumb */}
                  <Breadcrumb
                    className="flex-1 min-w-0 hidden xs:block"
                    variant={getBreadcrumbVariant()}
                    showIcons={true}
                    showBadges={false}
                    compact={false}
                    extra={breadcrumbExtra}
                  />

                  {/* Additional Header Content */}
                  {headerContent}
                </div>

                {/* Right side header content */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {showStats && (
                    <div className="hidden xs:block">
                      <StatsWidget />
                    </div>
                  )}
                </div>
              </header>
            )}

            {/* Main Content */}
            <main className={`flex-1 overflow-y-auto ${getMainPaddingClasses()}`}>
              {children || <Outlet />}
            </main>

            {/* Footer */}
            {showFooter && variant !== 'minimal' && (
              <footer className="flex-shrink-0 border-t border-gray-100 bg-white/80 backdrop-blur-sm px-4 py-2 text-center text-xs text-gray-500">
                © 2026 App Design & Development by Thammaphon Chittasuwanna (SDM)
              </footer>
            )}
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default BaseLayout;
