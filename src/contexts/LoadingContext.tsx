import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================
// APP-LEVEL LOADING CONTEXT
// Only handles initial app loading (health check, auth)
// ============================================

interface AppLoadingState {
  isInitialLoading: boolean;
  hasError: boolean;
  progress: number;
}

interface AppLoadingContextType {
  isInitialLoading: boolean;
  hasError: boolean;
  progress: number;
  startInitialLoading: () => void;
  completeInitialLoading: () => void;
  setInitialError: (error: boolean) => void;
  setProgress: (progress: number) => void;
}

const AppLoadingContext = createContext<AppLoadingContextType | undefined>(undefined);

interface AppLoadingProviderProps {
  children: ReactNode;
}

export const AppLoadingProvider: React.FC<AppLoadingProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppLoadingState>({
    isInitialLoading: true,
    hasError: false,
    progress: 0,
  });

  const startInitialLoading = useCallback(() => {
    setState({
      isInitialLoading: true,
      hasError: false,
      progress: 0,
    });
  }, []);

  const completeInitialLoading = useCallback(() => {
    setState({
      isInitialLoading: false,
      hasError: false,
      progress: 100,
    });
  }, []);

  const setInitialError = useCallback((error: boolean) => {
    setState((prev) => ({
      ...prev,
      hasError: error,
      isInitialLoading: error ? false : prev.isInitialLoading,
    }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState((prev) => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
    }));
  }, []);

  const value: AppLoadingContextType = {
    isInitialLoading: state.isInitialLoading,
    hasError: state.hasError,
    progress: state.progress,
    startInitialLoading,
    completeInitialLoading,
    setInitialError,
    setProgress,
  };

  return <AppLoadingContext.Provider value={value}>{children}</AppLoadingContext.Provider>;
};

export const useAppLoading = (): AppLoadingContextType => {
  const context = useContext(AppLoadingContext);
  if (!context) {
    throw new Error('useAppLoading must be used within an AppLoadingProvider');
  }
  return context;
};

// Backward compatibility alias
export const useInitialLoading = useAppLoading;

export default AppLoadingContext;
