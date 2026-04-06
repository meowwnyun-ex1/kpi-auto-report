import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingProvider, useInitialLoading } from './contexts/LoadingContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { ErrorBoundary } from './components/features/ErrorBoundary';
import { Toaster } from './components/ui/toaster';
import { UnifiedError } from './components/ui/unified-error';
import { HomePage, LoginPage } from './pages';
import { MainDashboard } from './pages/dashboard';
import { KPIDashboard, KPIDataEntry, KPIDepartment } from './pages/kpi';
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

          {/* Main KPI Dashboard - Accessible by all users */}
          <Route path="/dashboard" element={<MainDashboard />} />

          {/* KPI Routes - Data Entry protected for Manager/Admin */}
          {KPI_CATEGORIES.map((category) => (
            <React.Fragment key={category}>
              <Route
                path={`/${category}/entry`}
                element={
                  <ProtectedRoute>
                    <KPIDataEntry />
                  </ProtectedRoute>
                }
              />
              <Route
                path={`/${category}/dept`}
                element={
                  <ProtectedRoute>
                    <KPIDepartment />
                  </ProtectedRoute>
                }
              />
              <Route path={`/${category}`} element={<KPIDashboard />} />
            </React.Fragment>
          ))}

          {/* Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <ShellLayout variant="minimal" showSidebar={false} showHeader={false}>
                <UnifiedError type="404" />
              </ShellLayout>
            }
          />
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
