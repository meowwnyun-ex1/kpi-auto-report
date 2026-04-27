// Main dashboard exports
export { default as MainDashboard } from './pages/MainDashboard';
export { default as CategoryDashboard } from './pages/CategoryDashboard';
export { default as CompactDashboard } from './pages/CompactDashboard';

// Component exports
export { CategoriesTab } from './components/CategoriesTab';
export { DepartmentsTab } from './components/DepartmentsTab';
export { DetailsTab } from './components/DetailsTab';
export { OverviewTab } from './components/OverviewTab';

// Hook exports
export { useDashboardData } from './hooks/useDashboardData';

// Chart exports
export { CategoryCharts as CategoryChart } from './charts/CategoryCharts';
export { OverviewCharts as DepartmentChart } from './charts/OverviewCharts';

// Card exports
export { OverviewSummaryCard as SummaryCard } from './cards/OverviewSummaryCard';
export { CategorySummaryCards as CategoryCard } from './cards/CategorySummaryCards';
export { DepartmentBreakdownCards as DepartmentCard } from './cards/DepartmentBreakdownCards';

// Table exports
export { CategorySummaryTable as CategoryTable } from './tables/CategorySummaryTable';
export { CategoryDetailsTable as DepartmentTable } from './tables/CategoryDetailsTable';

// Constants
export * from './constants';
