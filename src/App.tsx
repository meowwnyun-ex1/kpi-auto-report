import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLoadingProvider, useAppLoading } from './contexts/LoadingContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { FiscalYearProvider } from './contexts/FiscalYearContext';
import { ErrorBoundary } from '@/shared';
import { Toaster } from './components/ui/toaster';
import { UnifiedError } from './components/ui/unified-error';
import { HomePage, LoginPage } from './pages';
// Modern Pages - New UX/UI Design
import {
  ModernDashboardPage,
  ModernYearlyTargetsPage,
  ModernMonthlyTargetsPage,
  ModernMonthlyResultsPage,
  ApprovalRoutePage,
} from './pages/modern/index';
// Legacy pages (kept for reference)
import { MainDashboard, CompactDashboard, CategoryDashboard } from './pages/dashboard/index';
import {
  YearlyTargetsPage,
  MonthlyTargetsPage,
  MonthlyResultPage,
  ActionPlansPage,
} from './pages/kpi/index';
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminEmployeesPage,
  AdminSettingsPage,
  AdminKPICategoriesPage,
  AdminApprovalRoutesPage,
} from './pages/admin/index';
import InitialLoading from './components/ui/initial-loading';
import { ShellLayout } from '@/components/layout';

// KPI Categories
const KPI_CATEGORIES = [
  'safety',
  'quality',
  'delivery',
  'compliance',
  'hr',
  'attractive',
  'environment',
  'cost',
];

// Protected Route Component - Manager/Admin only
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const isManagerOrAdmin =
    isAuthenticated &&
    (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isManagerOrAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component - Admin only
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isInitialLoading } = useAppLoading();

  return (
    <RefreshProvider>
      {isInitialLoading && <InitialLoading />}

      {!isInitialLoading && (
        <Routes>
          {/* Home */}
          <Route path="/" element={<HomePage />} />
          <Route path="/index" element={<HomePage />} />

          {/* Modern Dashboard Routes - New UX/UI */}
          <Route path="/dashboard" element={<ModernDashboardPage />} />

          {/* Legacy Dashboard Routes */}
          <Route path="/dashboard-legacy" element={<MainDashboard />} />
          <Route path="/dashboard-compact" element={<CompactDashboard />} />
          {KPI_CATEGORIES.map((category) => (
            <Route
              key={category}
              path={`/dashboard/${category}`}
              element={<CategoryDashboard category={category} />}
            />
          ))}

          {/* Modern KPI Management - New UX/UI */}
          <Route
            path="/yearly-targets"
            element={
              <ProtectedRoute>
                <ModernYearlyTargetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-targets"
            element={
              <ProtectedRoute>
                <ModernMonthlyTargetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-result"
            element={
              <ProtectedRoute>
                <ModernMonthlyResultsPage />
              </ProtectedRoute>
            }
          />

          {/* Approval Route Detail Views */}
          <Route
            path="/yearly-targets/:id/approval-route"
            element={
              <ProtectedRoute>
                <ApprovalRoutePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-targets/:id/approval-route"
            element={
              <ProtectedRoute>
                <ApprovalRoutePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-result/:id/approval-route"
            element={
              <ProtectedRoute>
                <ApprovalRoutePage />
              </ProtectedRoute>
            }
          />

          {/* Legacy KPI Routes */}
          <Route
            path="/yearly-targets-legacy"
            element={
              <ProtectedRoute>
                <YearlyTargetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-targets-legacy"
            element={
              <ProtectedRoute>
                <MonthlyTargetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-result-legacy"
            element={
              <ProtectedRoute>
                <MonthlyResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/action-plans"
            element={
              <ProtectedRoute>
                <ActionPlansPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <AdminRoute>
                <AdminEmployeesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <AdminRoute>
                <AdminKPICategoriesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/approval-routes"
            element={
              <AdminRoute>
                <AdminApprovalRoutesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminSettingsPage />
              </AdminRoute>
            }
          />

          {/* Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* 404 - Full page error with consistent layout */}
          <Route path="*" element={<UnifiedError type="404" useShellLayout={true} />} />
        </Routes>
      )}
    </RefreshProvider>
  );
};

function App() {
  return (
    <AppLoadingProvider>
      <AuthProvider>
        <FiscalYearProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
          <Toaster />
        </FiscalYearProvider>
      </AuthProvider>
    </AppLoadingProvider>
  );
}

export default App;
