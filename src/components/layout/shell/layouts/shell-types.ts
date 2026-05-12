/**
 * Shell Layout Types
 */

export type LayoutVariant = 'user' | 'admin' | 'minimal';

export interface ShellLayoutConfig {
  variant: LayoutVariant;
  showSidebar?: boolean;
  showHeader?: boolean;
  showStats?: boolean;
  breadcrumbExtra?: string;
}
