import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingProvider, useInitialLoading } from './contexts/LoadingContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { FiscalYearProvider } from './contexts/FiscalYearContext';
import { ErrorBoundary } from '@/shared';
import { Toaster } from './components/ui/toaster';
import { UnifiedError } from './components/ui/unified-error';
import { HomePage, LoginPage } from './pages';
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
} from './pages/admin/index';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
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
  const { isLoading: isInitialLoading } = useInitialLoading();

  return (
    <RefreshProvider>
      {isInitialLoading && <InitialLoading />}

      {!isInitialLoading && (
        <Routes>
          {/* Home */}
          <Route path="/" element={<HomePage />} />
          <Route path="/index" element={<HomePage />} />

          {/* Dashboard Routes - Accessible by all users */}
          <Route path="/dashboard" element={<MainDashboard />} />
          <Route path="/dashboard-compact" element={<CompactDashboard />} />
          {KPI_CATEGORIES.map((category) => (
            <Route
              key={category}
              path={`/dashboard/${category}`}
              element={<CategoryDashboard category={category} />}
            />
          ))}

          {/* KPI Management - 3 main forms */}
          <Route
            path="/yearly-targets"
            element={
              <ProtectedRoute>
                <YearlyTargetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-targets"
            element={
              <ProtectedRoute>
                <MonthlyTargetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-result"
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
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminSettingsPage />
              </AdminRoute>
            }
          />

          {/* Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Change Password */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          {/* 404 - Full page error with consistent layout */}
          <Route path="*" element={<UnifiedError type="404" useShellLayout={true} />} />
        </Routes>
      )}
    </RefreshProvider>
  );
};

function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <FiscalYearProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
          <Toaster />
        </FiscalYearProvider>
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App;
