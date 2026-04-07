import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingProvider, useInitialLoading } from './contexts/LoadingContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { ErrorBoundary } from './components/features/ErrorBoundary';
import { Toaster } from './components/ui/toaster';
import { UnifiedError } from './components/ui/unified-error';
import { HomePage, LoginPage } from './pages';
import { MainDashboard, CategoryDashboard } from './pages/dashboard';
import OverviewPage from './pages/kpi/OverviewPage';
import YearlyTargetsPage from './pages/kpi/YearlyTargetsPage';
import MonthlyEntryPage from './pages/kpi/MonthlyEntryPage';
import ActionPlansPage from './pages/kpi/ActionPlansPage';
import AdminPage from './pages/admin/AdminPage';
import InitialLoading from './components/ui/initial-loading';
import { ShellLayout } from '@/features/shell';
import { useVisitorTracking } from './hooks/useVisitorTracking';

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

  useVisitorTracking();

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

          {/* KPI Management - Separate pages */}
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
            path="/monthly-entry"
            element={
              <ProtectedRoute>
                <MonthlyEntryPage />
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

          {/* Admin - Consolidated settings page */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
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
    <ErrorBoundary>
      <LoadingProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
      </LoadingProvider>
    </ErrorBoundary>
  );
}

export default App;
