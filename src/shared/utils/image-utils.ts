/**
 * Image utility functions
 */

export function getFallbackImage(type: string = 'default'): string {
  switch (type) {
    case 'logo':
      return '/public/DENSO_LOGO.png';
    case 'login':
      return '/public/Avatar.png';
    case '404':
      return '/public/404.png';
    case 'error':
      return '/public/Sorry.png';
    case 'network':
    case 'not-found':
    default:
      return '/public/Avatar.png';
  }
}
