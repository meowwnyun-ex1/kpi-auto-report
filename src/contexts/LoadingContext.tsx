import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';

// Global error state for InitialLoading
let errorSetters: Array<(error: boolean) => void> = [];

// Global error setter function
export const setGlobalError = (error: boolean) => {
  errorSetters.forEach((setter) => setter(error));
};

export const registerErrorSetter = (setter: (error: boolean) => void) => {
  errorSetters.push(setter);
  return () => {
    errorSetters = errorSetters.filter((s) => s !== setter);
  };
};

// Global rate limiter for API requests
class GlobalRateLimiter {
  private static instance: GlobalRateLimiter;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private readonly maxConcurrent = 2; // Max 2 requests at a time
  private readonly delayBetweenRequests = 1000; // 1 second between requests

  static getInstance(): GlobalRateLimiter {
    if (!GlobalRateLimiter.instance) {
      GlobalRateLimiter.instance = new GlobalRateLimiter();
    }
    return GlobalRateLimiter.instance;
  }

  async execute<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.maxConcurrent);

      // Execute requests in parallel (up to maxConcurrent)
      await Promise.allSettled(batch.map((request) => request()));

      // Wait between batches
      if (this.requestQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.delayBetweenRequests));
      }
    }

    this.isProcessing = false;
  }
}

interface LoadingState {
  isLoading: boolean;
  message: string;
  progress: number;
  stage: string;
  error: string | null;
  isStuck: boolean;
  isInitialLoading: boolean;
  isComplete: boolean;
  hasError: boolean;
}

interface LoadingContextType {
  loading: LoadingState;
  setLoading: (loading: Partial<LoadingState>) => void;
  startLoading: (message?: string, stage?: string) => void;
  stopLoading: () => void;
  setProgress: (progress: number) => void;
  setStage: (stage: string) => void;
  setError: (error: string | null) => void;
  forceRefresh: () => void;
  // Initial loading functions
  startInitialLoading: () => void;
  completeInitialLoading: () => void;
  setInitialError: (error: boolean) => void;
  // Backward compatibility
  isLoading: boolean;
  loadingText: string;
  loadingCount: number;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loading, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: '',
    progress: 0,
    stage: '',
    error: null,
    isStuck: false,
    isInitialLoading: true,
    isComplete: false,
    hasError: false,
  });

  const [loadingText, setLoadingText] = useState('');
  const [stuckTimer, setStuckTimer] = useState<NodeJS.Timeout | null>(null);

  // Listen to global error state
  useEffect(() => {
    const unregister = registerErrorSetter((error: boolean) => {
      setLoadingState((prev) => ({ ...prev, hasError: error }));
    });

    return unregister;
  }, []);

  const setLoading = useCallback((newLoading: Partial<LoadingState>) => {
    setLoadingState((prev) => ({ ...prev, ...newLoading }));
  }, []);

  const startLoading = useCallback(
    (message = 'Loading...', stage = '') => {
      // Clear any existing stuck timer
      if (stuckTimer) {
        clearTimeout(stuckTimer);
        setStuckTimer(null);
      }

      setLoadingState((prev) => ({
        ...prev,
        isLoading: true,
        message,
        progress: 0,
        stage,
        error: null,
        isStuck: false,
      }));

      // Set stuck timer - if loading takes more than 15 seconds, mark as stuck
      const timer = setTimeout(() => {
        setLoadingState((prev) => ({
          ...prev,
          isStuck: true,
          error: 'Loading seems to be taking longer than expected. You can try refreshing.',
        }));
      }, 15000); // Increased from 10s to 15s for better UX

      setStuckTimer(timer);
    },
    [stuckTimer]
  );

  const stopLoading = useCallback(() => {
    // Clear stuck timer
    if (stuckTimer) {
      clearTimeout(stuckTimer);
      setStuckTimer(null);
    }

    setLoadingState((prev) => ({
      ...prev,
      isLoading: false,
      progress: 100,
      isStuck: false,
      error: null,
    }));
  }, [stuckTimer]);

  const setProgress = useCallback(
    (progress: number) => {
      // Reset stuck timer when progress is made
      if (stuckTimer) {
        clearTimeout(stuckTimer);
        setStuckTimer(null);
      }

      setLoadingState((prev) => ({
        ...prev,
        progress: Math.min(100, Math.max(0, progress)),
        isStuck: false,
        error: null,
      }));

      // Set new stuck timer with progressive delays
      const delay = progress > 80 ? 10000 : progress > 50 ? 15000 : 20000; // Progressive timeout
      const timer = setTimeout(() => {
        setLoadingState((prev) => ({
          ...prev,
          isStuck: true,
          error: 'Loading seems to be taking longer than expected. You can try refreshing.',
        }));
      }, delay);

      setStuckTimer(timer);
    },
    [stuckTimer]
  );

  const setStage = useCallback((stage: string) => {
    setLoadingState((prev) => ({
      ...prev,
      stage,
    }));
  }, []);

  const setError = useCallback(
    (error: string | null) => {
      // Clear stuck timer when error is set
      if (stuckTimer) {
        clearTimeout(stuckTimer);
        setStuckTimer(null);
      }

      setLoadingState((prev) => ({
        ...prev,
        error,
        isStuck: !!error,
        isLoading: !!error ? false : prev.isLoading, // Stop loading on error
      }));
    },
    [stuckTimer]
  );

  const forceRefresh = useCallback(() => {
    // Clear all timers before refresh
    if (stuckTimer) {
      clearTimeout(stuckTimer);
      setStuckTimer(null);
    }

    // Reset loading state
    stopLoading();

    // Smooth refresh with a small delay
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [stopLoading, stuckTimer]);

  // Initial loading functions
  const startInitialLoading = useCallback(() => {
    setLoading({
      isInitialLoading: true,
      isComplete: false,
      hasError: false,
      progress: 0,
    });
  }, []);

  const completeInitialLoading = useCallback(() => {
    setLoading({
      isInitialLoading: false,
      isComplete: true,
      progress: 100,
    });
  }, []);

  // Remove auto-completion - let InitialLoading component control the flow
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     // Check if there are any errors in the system
  //     const hasErrors = loading.error || loading.hasError;
  //     if (!hasErrors) {
  //       completeInitialLoading();
  //     }
  //   }, 3000); // Check after 3 seconds

  //   return () => clearTimeout(timer);
  // }, [completeInitialLoading, loading.error, loading.hasError]);

  const setInitialError = useCallback(
    (error: boolean) => {
      setLoading({
        hasError: error,
        isInitialLoading: error ? false : loading.isInitialLoading,
      });
    },
    [loading.isInitialLoading]
  );

  // Backward compatibility methods
  const showLoading = useCallback((text = '') => {
    setLoadingText(text);
    setLoadingState((prev) => ({ ...prev, isLoading: true, message: text }));
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingText('');
    setLoadingState((prev) => ({ ...prev, isLoading: false, message: '' }));
  }, []);

  const value: LoadingContextType = {
    loading,
    setLoading,
    startLoading,
    stopLoading,
    setProgress,
    setStage,
    setError,
    forceRefresh,
    // Initial loading functions
    startInitialLoading,
    completeInitialLoading,
    setInitialError,
    // Backward compatibility
    isLoading: loading.isLoading,
    loadingText,
    loadingCount: 0,
    showLoading,
    hideLoading,
  };

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Backward compatibility hook
export const useInitialLoading = () => {
  const { loading, startInitialLoading, completeInitialLoading, setInitialError } = useLoading();

  return {
    isLoading: loading.isInitialLoading,
    isComplete: loading.isComplete,
    hasError: loading.hasError,
    progress: loading.progress,
    startLoading: startInitialLoading,
    completeLoading: completeInitialLoading,
    setError: setInitialError,
    setProgress: () => {
      // This function is kept for compatibility but not used
    },
  };
};

// Progressive fetch hook with stage tracking
export const useProgressiveFetch = () => {
  const { startLoading, setProgress, setStage, stopLoading, setError } = useLoading();
  const rateLimiter = GlobalRateLimiter.getInstance();

  const fetchWithProgress = useCallback(
    async <T,>(
      steps: Array<{
        fetch: () => Promise<T>;
        progress: number;
        name?: string;
        stage?: string;
      }>,
      message = 'Loading data...'
    ): Promise<T[]> => {
      startLoading(message, steps[0]?.stage || 'Starting...');
      const results: T[] = [];
      const retryMap = new Map<number, number>(); // Track retry attempts per step

      try {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          setProgress(step.progress);
          if (step.stage) {
            setStage(step.stage);
          }

          let retryCount = retryMap.get(i) || 0;
          const maxRetries = 3;
          let result: T | undefined;

          // Wrap the fetch with rate limiter
          const rateLimitedFetch = () => rateLimiter.execute(step.fetch);

          while (retryCount < maxRetries) {
            try {
              result = await rateLimitedFetch();
              break; // Success, exit retry loop
            } catch (error) {
              retryCount++;
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred';

              // Check if it's a 429 error (rate limit)
              if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
                if (retryCount < maxRetries) {
                  // Exponential backoff: 2s, 4s, 8s (longer for rate limit errors)
                  const delay = Math.pow(2, retryCount) * 1000;
                  await new Promise((resolve) => setTimeout(resolve, delay));
                  retryMap.set(i, retryCount);
                  continue;
                } else {
                  throw new Error('Rate limit exceeded. Please try again later.');
                }
              } else {
                // For other errors, don't retry as aggressively
                if (retryCount === 1) {
                  throw error; // Only retry once for non-429 errors
                }
                await new Promise((resolve) => setTimeout(resolve, 500));
                retryMap.set(i, retryCount);
              }
            }
          }

          if (!result) {
            throw new Error('Failed to fetch data after multiple retries');
          }

          results.push(result);

          // Longer delay between steps to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        return results;
      } catch (error) {
        if (import.meta.env.DEV) console.error('Progressive fetch error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        // Check if it's a 404 error
        if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
          setError('404 Not Found: The requested page could not be found.');
        } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
          setError('Rate limit exceeded. Please wait a moment and try again.');
        } else {
          setError(errorMessage);
        }

        throw error;
      } finally {
        stopLoading();
      }
    },
    [startLoading, setProgress, setStage, stopLoading, setError, rateLimiter]
  );

  return { fetchWithProgress };
};

export default LoadingContext;
