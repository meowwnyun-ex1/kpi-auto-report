import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingProvider, useInitialLoading } from './contexts/LoadingContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { FiscalYearProvider } from './contexts/FiscalYearContext';
import { ErrorBoundary } from './components/features/ErrorBoundary';
import { Toaster } from './components/ui/toaster';
import { UnifiedError } from './components/ui/unified-error';
import { HomePage, LoginPage } from './pages';
import { MainDashboard, CategoryDashboard } from './pages/dashboard';
import OverviewPage from './pages/kpi/OverviewPage';
import YearlyTargetsPage from './pages/kpi/YearlyTargetsPage';
import MonthlyTargetsPage from './pages/kpi/MonthlyTargetsPage';
import MonthlyResultPage from './pages/kpi/MonthlyResultPage';
import ActionPlansPage from './pages/kpi/ActionPlansPage';
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminEmployeesPage,
  AdminSettingsPage,
  AdminKPICategoriesPage,
} from './pages/admin';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import InitialLoading from './components/ui/initial-loading';
import { ShellLayout } from '@/features/shell';

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

  if (!isManagerOrAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component - Admin only
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin');

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
          {KPI_CATEGORIES.map((category) => (
            <Route
              key={category}
              path={`/dashboard/${category}`}
              element={<CategoryDashboard category={category} />}
            />
          ))}

          {/* KPI Management - 3 main forms + Overview */}
          <Route
            path="/overview"
            element={
              <ProtectedRoute>
                <OverviewPage />
              </ProtectedRoute>
            }
          />
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
