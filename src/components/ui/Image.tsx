import React from 'react';
import { getFallbackImage } from '@/shared/utils';

interface ImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  fallbackType?: 'network' | 'not-found' | 'default' | '404' | 'error' | 'logo' | 'login';
  fallbackText?: string; // Text/emoji to show when image fails to load
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  optimized?: boolean; // Enable/disable lazy loading optimizations
  lazy?: boolean; // Control lazy loading behavior
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt = '',
  className = '',
  width = undefined,
  height = undefined,
  fallbackType = 'network',
  fallbackText,
  objectFit = 'cover',
  onError,
  optimized = true,
  lazy = true,
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoading(false);

    // Call custom onError handler if provided
    if (onError) {
      onError(e);
      return;
    }

    const target = e.target as HTMLImageElement;
    const fallbackSrc = getFallbackImage(fallbackType);

    // If current src is already the fallback, hide the image
    if (target.src.includes(fallbackSrc)) {
      target.style.display = 'none';
      return;
    }

    // Set to fallback image
    target.src = fallbackSrc;
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const finalSrc = src || getFallbackImage(fallbackType);

  // Don't show loading state for fallback images or when no src is provided
  const shouldShowLoading = isLoading && src && src !== finalSrc;

  // If fallbackText is provided and image failed to load, show the text
  if (hasError && fallbackText) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
          ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
          backgroundColor: 'transparent',
        }}>
        <span className="text-inherit">{fallbackText}</span>
      </div>
    );
  }

  if (shouldShowLoading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
          ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
          backgroundColor: 'transparent',
        }}>
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={`${className} bg-transparent`}
      style={{
        ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
        ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
        objectFit,
        backgroundColor: 'transparent',
      }}
      onError={handleError}
      onLoad={handleLoad}
      loading={lazy && optimized ? 'lazy' : 'eager'}
    />
  );
};

export default Image;
