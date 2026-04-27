import { useState, useEffect } from 'react';

/**
 * Standard hook for fiscal year selection
 * Provides consistent behavior across all pages
 */
export function useFiscalYearSelector(initialYear?: number) {
  const [fiscalYear, setFiscalYear] = useState<number>(initialYear || new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Generate available years: current year + 3 previous years
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];

    // Add current year and 3 previous years
    for (let i = 0; i <= 3; i++) {
      years.push(currentYear - i);
    }

    setAvailableYears(years);
  }, []);

  return {
    fiscalYear,
    setFiscalYear,
    availableYears,
  };
}
