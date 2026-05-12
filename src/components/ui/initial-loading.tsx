import React, { useState, useEffect, useRef } from 'react';
import { Image } from '@/components/ui/Image';
import { getApiUrl } from '@/config/api';
import { useAppLoading } from '@/contexts/LoadingContext';
import { cn } from '@/shared/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================
// INITIAL LOADING COMPONENT
// Handles app initialization (health check)
// ============================================

export const InitialLoading: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const {
    completeInitialLoading,
    setInitialError,
    setProgress: setContextProgress,
  } = useAppLoading();
  const mountedRef = useRef(true);

  // Smooth progress animation
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (hasError || isFadingOut) return;

    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return;
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const increment = Math.max(1, (90 - prev) / 10);
        return Math.min(prev + increment, 90);
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, [hasError, isFadingOut]);

  // Sync progress to context
  useEffect(() => {
    setContextProgress(progress);
  }, [progress, setContextProgress]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const serverResponse = await fetch(`${getApiUrl()}/health`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!serverResponse.ok) {
          setInitialError(true);
          setHasError(true);
          return;
        }

        setInitialError(false);
        setHasError(false);
        setProgress(100);
        setContextProgress(100);

        setTimeout(() => {
          if (!mountedRef.current) return;
          setIsFadingOut(true);
          setTimeout(() => {
            if (!mountedRef.current) return;
            setIsVisible(false);
            completeInitialLoading();
          }, 400);
        }, 200);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Initialization failed:', error);
        setInitialError(true);
        setHasError(true);
      }
    };

    const initTimer = setTimeout(() => {
      if (!hasError) {
        initializeApp();
      }
    }, 1500);

    return () => clearTimeout(initTimer);
  }, [completeInitialLoading, setInitialError, hasError, setContextProgress]);

  const handleRetry = () => {
    setIsRetrying(true);
    setHasError(false);
    setInitialError(false);
    setProgress(0);
    setContextProgress(0);

    setTimeout(() => {
      setIsRetrying(false);
      const initializeApp = async () => {
        try {
          const serverResponse = await fetch(`${getApiUrl()}/health`, {
            signal: AbortSignal.timeout(5000),
          });
          if (!serverResponse.ok) {
            setInitialError(true);
            setHasError(true);
            return;
          }

          setInitialError(false);
          setHasError(false);
          setProgress(100);
          setContextProgress(100);
          setIsFadingOut(true);

          setTimeout(() => {
            completeInitialLoading();
          }, 300);
        } catch (error) {
          if (import.meta.env.DEV) console.error('Retry failed:', error);
          setInitialError(true);
          setHasError(true);
        }
      };

      initializeApp();
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-teal-50/95 via-background to-sky-50/80',
        'transition-all duration-500 ease-out',
        isFadingOut && 'opacity-0 scale-[1.02]'
      )}>
      <div className="mx-auto max-w-sm space-y-6 px-6 text-center">
        <div className="relative">
          <div
            className={cn(
              'absolute inset-0 rounded-full blur-3xl transition-colors duration-500',
              hasError ? 'bg-destructive/20' : 'bg-primary/15'
            )}
          />
          <div className="relative">
            <Image
              src="/loading.png"
              alt="Loading"
              className={cn(
                'w-16 h-16 mx-auto drop-shadow-lg transition-all duration-300',
                hasError && 'grayscale opacity-50'
              )}
              width={64}
              height={64}
              fallbackType="default"
            />
          </div>
        </div>

        <div className="space-y-2">
          <h1
            className={cn(
              'text-xl font-bold tracking-tight transition-colors duration-300',
              hasError ? 'text-destructive' : 'text-foreground'
            )}>
            {hasError ? 'Connection Failed' : 'Loading'}
          </h1>
        </div>

        {!hasError ? (
          <div className="space-y-3 w-48">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-teal-400 to-primary transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-center text-xs text-muted-foreground">
              <span>{Math.round(Math.min(progress, 100))}%</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Connection error</span>
            </div>
            <Button onClick={handleRetry} disabled={isRetrying} size="sm">
              <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
              <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitialLoading;
