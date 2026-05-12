import { useState, useCallback } from 'react';

// ============================================
// ACTION LOADING HOOK
// For button clicks, form submissions, etc.
// ============================================

interface AsyncOperationState {
  isLoading: boolean;
  error: string | null;
}

interface UseAsyncOperationReturn {
  isLoading: boolean;
  error: string | null;
  execute: <T>(operation: () => Promise<T>, errorMessage?: string) => Promise<T | null>;
  resetError: () => void;
}

export const useAsyncOperation = (): UseAsyncOperationReturn => {
  const [state, setState] = useState<AsyncOperationState>({
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): Promise<T | null> => {
    setState({ isLoading: true, error: null });

    try {
      const result = await operation();
      setState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      setState({ isLoading: false, error: message });
      return null;
    }
  }, []);

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    isLoading: state.isLoading,
    error: state.error,
    execute,
    resetError,
  };
};

export default useAsyncOperation;
