/**
 * MODERN PAGES - NEW UX/UI DESIGN
 * หน้าใหม่ทั้งหมด - สวยงาม ทันสมัย ใช้งานง่าย
 */

export { default as ModernDashboardPage } from './dashboard';
export { default as ModernYearlyTargetsPage } from './yearly-targets';
export { default as ModernMonthlyTargetsPage } from './monthly-targets';
export { default as ModernMonthlyResultsPage } from './monthly-results';
export { default as ApprovalRoutePage } from './approval-route';

// Re-export components for use
export {
  ModernShellLayout,
  ModernPageLayout,
  ModernSidebar,
  ModernHeader,
} from '@/components/layout/modern-layout';
export {
  COLORS,
  SHADOWS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  CATEGORY_COLORS,
  STATUS_COLORS,
} from '@/shared/styles/design-system';
