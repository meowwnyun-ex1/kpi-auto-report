import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnifiedError } from '@/components/ui/unified-error';
import { getApiUrl } from '@/config/api';
import { Image } from '@/components/ui/Image';
import { Banner } from '@/shared/types';

/**
 * BannerCarousel — compact promo strip for homepage.
 * Fetches banners from SQL database with compressed thumbnails.
 * Display: Full width × 200px height (image fits without zoom)
 */

/** Banner size - full width responsive, 200px height */
const BANNER_FRAME =
  'relative w-full h-[200px] overflow-hidden rounded-xl bg-white/90 shadow-sm ring-1 ring-sky-100/40';

const BannerCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorSlide, setErrorSlide] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch banners from SQL database
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/banners?active=true`);
        if (!response.ok) throw new Error('Failed to fetch banners');

        const result = await response.json();
        const activeBanners = result.data || [];
        setBanners(activeBanners.filter((banner: Banner) => banner.image_thumbnail));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching banners:', error);
        setHasError(true);
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const next = useCallback(() => {
    if (hasError) {
      setErrorSlide((prev) => (prev + 1) % 3);
    } else {
      setCurrent((prev) => (prev + 1) % Math.max(1, banners.length));
    }
  }, [hasError, banners.length]);

  const prev = useCallback(() => {
    if (hasError) {
      setErrorSlide((prev) => (prev - 1 + 3) % 3);
    } else {
      setCurrent((prev) => (prev - 1 + Math.max(1, banners.length)) % Math.max(1, banners.length));
    }
  }, [hasError, banners.length]);

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
      <div className="w-full h-[200px] animate-pulse rounded-xl border border-pink-100/60 bg-gradient-to-r from-sky-100/50 to-pink-100/40" />
    );
  }

  return (
    <div className="flex w-full flex-col items-center py-1">
      <div
        className={BANNER_FRAME}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <div className="relative w-full h-full overflow-hidden">
          {hasError ? (
            <div className="relative flex h-full min-h-0 w-full items-center justify-center">
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
                      type="banner-error"
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
            <div className="relative h-full w-full">
              {banners.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-50/80 via-background to-sky-50/60">
                  <UnifiedError
                    type="data-error"
                    title="No Banners Available"
                    message="There are currently no active banners to display."
                    compact={true}
                    showRetry={true}
                    onRetry={retry}
                    className="max-w-sm"
                  />
                </div>
              ) : (
                banners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out flex items-center justify-center ${
                      index === current ? 'opacity-100' : 'opacity-0'
                    }`}>
                    {banner.image_thumbnail ? (
                      banner.link_url ? (
                        <a
                          href={banner.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-full cursor-pointer">
                          <Image
                            src={banner.image_thumbnail}
                            alt={`Banner ${banner.id}`}
                            className="w-full h-full hover:opacity-90 transition-opacity"
                            fallbackType="error"
                            objectFit="cover"
                            lazy={false}
                          />
                        </a>
                      ) : (
                        <Image
                          src={banner.image_thumbnail}
                          alt={`Banner ${banner.id}`}
                          className="w-full h-full"
                          fallbackType="error"
                          objectFit="cover"
                          lazy={false}
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/60 to-muted">
                        <UnifiedError
                          type="banner-error"
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

          {/* Enhanced Navigation Arrows */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-1.5 sm:px-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={prev}
              className="pointer-events-auto h-8 w-8 rounded-full bg-white/95 shadow-sm backdrop-blur-sm hover:bg-white sm:h-9 sm:w-9">
              <ChevronLeft className="h-3.5 w-3.5 text-sky-700 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={next}
              className="pointer-events-auto h-8 w-8 rounded-full bg-white/95 shadow-sm backdrop-blur-sm hover:bg-white sm:h-9 sm:w-9">
              <ChevronRight className="h-3.5 w-3.5 text-sky-700 sm:h-4 sm:w-4" />
            </Button>
          </div>

          <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 sm:bottom-2 sm:gap-1.5">
            {(hasError
              ? [
                  { bg: 'bg-gradient-to-br from-slate-50 to-slate-100' },
                  { bg: 'bg-gradient-to-br from-teal-50 via-cyan-50/80 to-sky-50/90' },
                  { bg: 'bg-gradient-to-br from-sky-50 to-indigo-50/80' },
                ]
              : banners.length > 0
                ? banners
                : [{ id: 1 }]
            ).map((item, index) => (
              <button
                key={hasError ? `error-${index}` : 'id' in item ? String(item.id) : `b-${index}`}
                type="button"
                onClick={() => (hasError ? setErrorSlide(index) : setCurrent(index))}
                aria-label={`Go to ${hasError ? 'error' : 'banner'} slide ${index + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  (hasError ? errorSlide === index : current === index)
                    ? 'h-1.5 w-7 bg-primary shadow-sm sm:h-2 sm:w-9'
                    : 'h-1.5 w-1.5 bg-foreground/20 hover:bg-foreground/35 sm:h-2 sm:w-2'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerCarousel;
