import React, { useState, useEffect } from 'react';
import { Image } from '@/components/ui/Image';
import { getApiUrl } from '@/config/api';
import { useLoading } from '@/contexts/LoadingContext';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ERROR_MESSAGES, LOADING_MESSAGES } from '@/shared/constants';

// Progressive loading messages - smooth and not annoying
const getLoadingMessage = (progress?: number): string => {
  if (!progress) return LOADING_MESSAGES.INITIAL;
  if (progress < 20) return 'Connecting...';
  if (progress < 50) return 'Loading...';
  if (progress < 80) return 'Almost ready...';
  return 'Ready!';
};

export const InitialLoading: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { completeInitialLoading, setInitialError } = useLoading();

  // Faster progress animation (300ms instead of 600ms)
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (hasError) return prev;
        if (prev >= 100) return 100;
        return prev + Math.random() * 3 + 2; // Faster increment
      });
    }, 300);

    return () => clearInterval(progressInterval);
  }, [hasError]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const serverResponse = await fetch(`${getApiUrl()}/health`, {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        if (!serverResponse.ok) {
          setInitialError(true);
          setHasError(true);
          return;
        }

        setInitialError(false);
        setHasError(false);
        setProgress(100);
        setIsFadingOut(true);

        // Faster fade out (300ms instead of 500ms)
        setTimeout(() => {
          completeInitialLoading();
        }, 300);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Initialization failed:', error);
        setInitialError(true);
        setHasError(true);
      }
    };

    // Start immediately instead of 800ms delay
    const initTimer = setTimeout(() => {
      if (!hasError) {
        initializeApp();
      }
    }, 200); // Reduced from 800ms to 200ms

    return () => clearTimeout(initTimer);
  }, [completeInitialLoading, setInitialError, hasError]);

  const handleRetry = () => {
    setIsRetrying(true);
    setHasError(false);
    setInitialError(false);
    setProgress(0);

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

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-teal-50/90 via-background to-sky-50/70 transition-all duration-300',
        isFadingOut && 'scale-95 opacity-0'
      )}>
      <div className="mx-auto max-w-sm space-y-6 px-6 text-center">
        <div className="relative">
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-primary/15 blur-3xl',
              hasError ? 'animate-pulse bg-destructive/20' : 'animate-pulse'
            )}
          />
          <div className="relative">
            <Image
              src="/loading.png"
              alt="Loading"
              className={cn(
                'w-16 h-16 mx-auto drop-shadow-lg transition-all duration-300',
                hasError ? 'grayscale opacity-50' : 'animate-pulse'
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
            {hasError ? 'Connection Failed' : progress < 100 ? 'Loading' : 'Ready'}
          </h1>
          <p
            className={cn(
              'text-sm transition-colors duration-300',
              hasError ? 'text-destructive/90' : 'text-muted-foreground'
            )}>
            {hasError ? ERROR_MESSAGES.NETWORK_ERROR : getLoadingMessage(progress)}
          </p>
        </div>

        {!hasError ? (
          <div className="space-y-2">
            <div className="relative">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-teal-400 transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-center text-xs">
              <span className="font-medium text-primary">
                {Math.round(Math.min(progress, 100))}%
              </span>
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
