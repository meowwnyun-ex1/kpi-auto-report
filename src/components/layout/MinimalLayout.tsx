import React from 'react';
import { Outlet } from 'react-router-dom';
import BaseLayout, { BaseLayoutProps } from '@/components/layout/BaseLayout';

interface MinimalLayoutProps extends Omit<
  BaseLayoutProps,
  'variant' | 'showSidebar' | 'sidebarContent' | 'showHeader' | 'showStats'
> {
  breadcrumbExtra?: string;
}

const MinimalLayout: React.FC<MinimalLayoutProps> = ({ children, breadcrumbExtra, ...props }) => {
  return (
    <BaseLayout
      variant="minimal"
      showSidebar={false}
      showStats={false}
      showHeader={false}
      showFooter={false}
      breadcrumbExtra={breadcrumbExtra}
      className="min-h-screen"
      {...props}>
      {children || <Outlet />}
    </BaseLayout>
  );
};

export default MinimalLayout;
export { MinimalLayout };
