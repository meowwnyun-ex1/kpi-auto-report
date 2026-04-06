/**
 * App shell: layouts, navigation sidebar, and admin chrome.
 * Single ShellLayout for ALL pages (user, admin, minimal).
 */
export { AppSidebar } from './sidebar/AppSidebar';
export { NavUser } from './sidebar/NavUser';
export type { ShellSidebarTheme } from './sidebar/NavUser';

export { AppHeader } from './header/AppHeader';
export type { AppHeaderProps } from './header/AppHeader';

// Single unified layout for all pages
export { ShellLayout } from './layouts/ShellLayout';
export type { ShellLayoutProps, LayoutVariant } from './layouts/ShellLayout';
