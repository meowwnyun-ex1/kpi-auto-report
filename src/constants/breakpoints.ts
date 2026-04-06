/**
 * Single source of truth for responsive breakpoints (Tailwind-aligned).
 * Use these for matchMedia in JS; pair with `sm:`/`md:`/`lg:` in classNames.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/** max-width: md — mobile / small screens */
export const mediaMobile = `(max-width: ${BREAKPOINTS.md}px)`;
/** min-width: md+1 and max-width: lg-1 — tablet */
export const mediaTablet = `(min-width: ${BREAKPOINTS.md + 1}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`;
/** min-width: lg — desktop */
export const mediaDesktop = `(min-width: ${BREAKPOINTS.lg}px)`;
