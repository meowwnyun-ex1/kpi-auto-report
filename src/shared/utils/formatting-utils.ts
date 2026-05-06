// Number formatting utilities
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '-';

  // Handle very small numbers to avoid scientific notation
  if (Math.abs(value) < 0.0001 && value !== 0) {
    return value.toFixed(4);
  }

  // Handle integers - no decimal places
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  // For decimals, limit to specified decimal places
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatDecimal(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return value.toFixed(decimals);
}

export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return `${value.toFixed(decimals)}%`;
}
