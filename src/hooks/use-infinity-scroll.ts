import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfinityScrollOptions {
  isLoading: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

export const useInfinityScroll = ({
  isLoading,
  hasNextPage,
  onLoadMore,
  threshold = 100
}: UseInfinityScrollOptions) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setIsIntersecting(true);
      } else {
        setIsIntersecting(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!targetRef.current) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold,
      rootMargin: '100px'
    });

    observerRef.current.observe(targetRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, threshold]);

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isLoading) {
      onLoadMore();
    }
  }, [isIntersecting, hasNextPage, isLoading, onLoadMore]);

  return { targetRef, isIntersecting };
};
