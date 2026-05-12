import { CATEGORY_COLORS as CATEGORY_COLORS_HEX } from '@/shared/constants/colors';
import type { CSSProperties } from 'react';
import { hexToRgba } from './color-utils';

export type CategoryKey = keyof typeof CATEGORY_COLORS_HEX;

export function getCategoryTheme(categoryKey: string) {
  const key = categoryKey as CategoryKey;
  const hex = CATEGORY_COLORS_HEX[key] ?? '#64748b';

  return {
    hex,
    style: {
      borderColor: hex,
      color: hex,
      backgroundColor: hexToRgba(hex, 0.08),
    } as CSSProperties,
    lightBg: hexToRgba(hex, 0.10),
    mediumBg: hexToRgba(hex, 0.18),
  };
}

