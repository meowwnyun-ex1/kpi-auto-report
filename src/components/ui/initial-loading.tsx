import React, { useState, useEffect, useRef } from 'react';
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
  const [isVisible, setIsVisible] = useState(true);
  const { completeInitialLoading, setInitialError } = useLoading();
  const mountedRef = useRef(true);

  // Smooth progress animation with easing
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Smooth progress animation
  useEffect(() => {
    if (hasError || isFadingOut) return;

    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return;
      setProgress((prev) => {
        if (prev >= 90) return prev; // Pause at 90% until server responds
        const increment = Math.max(1, (90 - prev) / 10); // Slower as it approaches 90
        return Math.min(prev + increment, 90);
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, [hasError, isFadingOut]);

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

        // Smooth fade out sequence
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
