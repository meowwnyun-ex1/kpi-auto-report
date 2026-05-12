/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliant patterns
 */

export const a11y = {
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  srOnly: 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[1600] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg',
};

export const responsive = {
  up: (bp: string) => `@media (min-width: ${bp})`,
  down: (bp: string) => `@media (max-width: ${bp})`,
};
