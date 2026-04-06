import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnifiedError } from '@/components/ui/unified-error';
import { getApiUrl } from '@/config/api';
import { Image } from '@/components/ui/Image';
import { Trip } from '@/shared/types';

/**
 * TripCarousel — used on the HomePage.
 * Fetches trips from SQL database with compressed thumbnails.
 * Display: Full width up to 800px × 600px (4:3 aspect ratio, image fits without zoom)
 */

/** Trip size - responsive width, 600px height (4:3 ratio) */
const TRIP_FRAME =
  'relative w-full max-w-[800px] h-[600px] mx-auto overflow-hidden rounded-2xl bg-white/80 backdrop-blur-md shadow-lg ring-1 ring-black/[0.03]';

const TripCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorSlide, setErrorSlide] = useState(0);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch trips from SQL database
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/trips?active=true`);
        if (!response.ok) throw new Error('Failed to fetch trips');

        const result = await response.json();
        const activeTrips = result.data || [];
        setTrips(activeTrips.filter((trip: Trip) => trip.image_thumbnail));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trips:', error);
        setHasError(true);
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const next = useCallback(() => {
    if (hasError) {
      setErrorSlide((prev) => (prev + 1) % 3);
    } else {
      setCurrent((prev) => (prev + 1) % Math.max(1, trips.length));
    }
  }, [hasError, trips.length]);

  const prev = useCallback(() => {
    if (hasError) {
      setErrorSlide((prev) => (prev - 1 + 3) % 3);
    } else {
      setCurrent((prev) => (prev - 1 + Math.max(1, trips.length)) % Math.max(1, trips.length));
    }
  }, [hasError, trips.length]);

  const retry = useCallback(() => {
    setHasError(false);
    setLoading(true);
    window.location.reload();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHovered) {
        next();
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [isHovered, next]);

  if (loading) {
    return (
      <div className="w-full max-w-[800px] h-[600px] mx-auto animate-pulse rounded-2xl bg-muted" />
    );
  }

  return (
    <div className="flex w-full flex-col items-center py-1">
      <div
        className={TRIP_FRAME}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <div className="relative w-full h-full overflow-hidden">
          {hasError ? (
            <div className="relative flex min-h-[200px] w-full items-center justify-center sm:min-h-[260px]">
              {[
                { bg: 'bg-gradient-to-br from-slate-50 to-slate-100' },
                { bg: 'bg-gradient-to-br from-teal-50 via-cyan-50/80 to-sky-50/90' },
                { bg: 'bg-gradient-to-br from-sky-50 to-indigo-50/80' },
              ].map((theme, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out flex items-center justify-center ${
                    index === errorSlide
                      ? 'opacity-100 transform translate-x-0'
                      : index < errorSlide
                        ? 'opacity-0 transform -translate-x-full'
                        : 'opacity-0 transform translate-x-full'
                  }`}>
                  <div
                    className={`w-full h-full flex items-center justify-center p-4 xs:p-6 sm:p-8 ${theme.bg}`}>
                    {/* Error Content - Use UnifiedError */}
                    <UnifiedError
                      type="trip-error"
                      compact={true}
                      showRetry={true}
                      onRetry={retry}
                      className="max-w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative flex w-full h-full items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50/50 via-sky-50/30 to-cyan-50/50">
              {trips.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-50/80 via-background to-cyan-50/50">
                  <UnifiedError
                    type="data-error"
                    title="No Trips Available"
                    message="There are currently no active trips to display."
                    compact={true}
                    showRetry={true}
                    onRetry={retry}
                    className="max-w-sm"
                  />
                </div>
              ) : (
                trips.map((trip, index) => (
                  <div
                    key={trip.id}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out flex items-center justify-center ${
                      index === current ? 'opacity-100' : 'opacity-0'
                    }`}>
                    {trip.image_thumbnail ? (
                      trip.link_url ? (
                        <a
                          href={trip.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-full cursor-pointer">
                          <Image
                            src={trip.image_thumbnail}
                            alt={trip.title}
                            className="w-full h-full hover:opacity-90 transition-opacity"
                            fallbackType="error"
                            objectFit="cover"
                            lazy={false}
                          />
                        </a>
                      ) : (
                        <Image
                          src={trip.image_thumbnail}
                          alt={trip.title}
                          className="w-full h-full"
                          fallbackType="error"
                          objectFit="cover"
                          lazy={false}
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted/50">
                        <UnifiedError
                          type="trip-error"
                          compact={true}
                          showRetry={false}
                          className="max-w-sm"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={prev}
              className="pointer-events-auto h-8 w-8 rounded-full bg-card/95 shadow-md backdrop-blur-sm hover:bg-card">
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={next}
              className="pointer-events-auto h-8 w-8 rounded-full bg-card/95 shadow-md backdrop-blur-sm hover:bg-card">
              <ChevronRight className="h-4 w-4 text-foreground" />
            </Button>
          </div>

          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
            {(hasError
              ? [
                  { bg: 'bg-gradient-to-br from-slate-50 to-slate-100' },
                  { bg: 'bg-gradient-to-br from-teal-50 via-cyan-50/80 to-sky-50/90' },
                  { bg: 'bg-gradient-to-br from-sky-50 to-indigo-50/80' },
                ]
              : trips.length > 0
                ? trips
                : [{ id: 1 }]
            ).map((item, index) => (
              <button
                key={hasError ? `error-${index}` : 'id' in item ? String(item.id) : `t-${index}`}
                type="button"
                onClick={() => (hasError ? setErrorSlide(index) : setCurrent(index))}
                aria-label={`Go to ${hasError ? 'error' : 'trip'} slide ${index + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  (hasError ? errorSlide === index : current === index)
                    ? 'h-1.5 w-6 bg-primary shadow-sm sm:w-7'
                    : 'h-1.5 w-1.5 bg-foreground/20 hover:bg-foreground/35'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripCarousel;
