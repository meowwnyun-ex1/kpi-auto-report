/**
 * Image Utilities
 */

export interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

export interface ImageStandard {
  width: number;
  height: number;
  className: string;
  fallbackType:
    | 'default'
    | 'error'
    | 'network'
    | 'not-found'
    | 'not_found'
    | '404'
    | 'loading'
    | 'logo'
    | 'login'
    | 'hot'
    | 'contact'
    | 'contact2';
}

export const ImageStandards = {
  // Logo & Branding
  LOGO: {
    width: 120,
    height: 120,
    className: 'object-contain',
    fallbackType: 'default' as const,
  },
  LOGIN_WIDE: {
    width: 120,
    height: 48,
    className: 'object-contain',
    fallbackType: 'login' as const,
  },

  // App Icons
  APP_ICON_SMALL: {
    width: 40,
    height: 40,
    className: 'object-contain rounded-lg',
    fallbackType: 'default' as const,
  },
  APP_ICON_LARGE: {
    width: 80,
    height: 80,
    className: 'object-contain rounded-xl',
    fallbackType: 'default' as const,
  },

  // Content Images
  BANNER_IMAGE: {
    width: 800,
    height: 400,
    className: 'object-cover rounded-lg',
    fallbackType: 'default' as const,
  },

  // UI Elements
  HOT_BADGE: {
    width: 32,
    height: 32,
    className: 'object-contain',
    fallbackType: 'default' as const,
  },

  // Loading & States
  LOADING_SPINNER: {
    width: 64,
    height: 64,
    className: 'object-contain',
    fallbackType: 'loading' as const,
  },

  // Error Images
  ERROR_ICON_SMALL: {
    width: 128,
    height: 128,
    className: 'object-contain',
    fallbackType: 'error' as const,
  },
  ERROR_ICON_LARGE: {
    width: 256,
    height: 256,
    className: 'object-contain',
    fallbackType: 'error' as const,
  },
  ERROR_404_LANDSCAPE: {
    width: 512,
    height: 256,
    className: 'object-contain',
    fallbackType: 'error' as const,
  },

  // Contact Images
  CONTACT_NORMAL: {
    width: 48,
    height: 48,
    className: 'object-contain rounded-full hover:scale-110 transition-transform duration-200',
    fallbackType: 'default' as const,
  },
  CONTACT_LARGE: {
    width: 64,
    height: 64,
    className: 'object-contain rounded-full hover:scale-110 transition-transform duration-200',
    fallbackType: 'default' as const,
  },

  // Form & Preview
  FORM_PREVIEW: {
    width: 200,
    height: 200,
    className: 'object-cover rounded-lg border border-gray-200',
    fallbackType: 'default' as const,
  },
} as const;

export type ImageStandardType = keyof typeof ImageStandards;

export function getImageProps(
  standard: ImageStandardType,
  overrides?: Partial<ImageProps>
): ImageProps {
  const config = ImageStandards[standard];

  return {
    src: '',
    alt: '',
    loading: 'lazy' as const,
    ...config,
    ...overrides,
    // Add fallback src from image-fallbacks
    fallbackSrc: getFallbackImage(config.fallbackType),
  };
}

export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackType: 'network' | 'default' = 'network'
): void {
  const target = event.target as HTMLImageElement;
  const fallbackSrc = getFallbackImage(fallbackType);

  if (target.src.includes(fallbackSrc)) {
    target.style.display = 'none';
  } else {
    target.src = fallbackSrc;
  }
}

// Fallback images - organized by usage type
const FALLBACK_IMAGES = {
  // General defaults
  default: '/sorry.png',
  loading: '/loading.png',

  // Error handling
  error: '/sorry.png',
  network: '/sorry.png',
  not_found: '/404.png',

  // Branding & logos
  logo: '/logo.png',
  login: '/DENSO_LOGO.png',

  // UI elements
  hot: '/hot.png',

  // Contact images
  contact: '/contact.png',
  contact2: '/contact2.png',
} as const;

export type FallbackType = keyof typeof FALLBACK_IMAGES;

// Normalize fallback type to handle aliases
function normalizeFallbackType(type: string): FallbackType {
  if (type === 'not-found' || type === '404') return 'not_found';
  if (type in FALLBACK_IMAGES) return type as FallbackType;
  return 'default';
}

export function getFallbackImage(type: FallbackType | 'not-found' | '404' = 'default'): string {
  const normalizedType = normalizeFallbackType(type);
  return FALLBACK_IMAGES[normalizedType];
}
