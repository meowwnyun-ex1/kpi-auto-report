/**
 * LAYOUT COMPONENTS
 * Clean, unified layout system using original shell components
 */

// Main layout components from shell folder
export { AppSidebar, NavUser, AppHeader, ShellLayout } from './shell';

// Types
export type { AppHeaderProps } from './shell/header/AppHeader';
export type { ShellLayoutProps, LayoutVariant } from './shell/layouts/ShellLayout';

// Modern aliases (for backward compatibility) - same components, different names
export {
  AppSidebar as ModernSidebar,
  AppHeader as ModernHeader,
  ShellLayout as ModernShellLayout,
} from './shell';

// Page layout wrapper
export { ModernPageLayout } from './modern-layout';
