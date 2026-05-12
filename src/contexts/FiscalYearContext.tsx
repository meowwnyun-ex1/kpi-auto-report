import React, { createContext, useContext, useState, useEffect } from 'react';

interface FiscalYearContextType {
  fiscalYear: number;
  setFiscalYear: (year: number) => void;
  availableYears: number[];
}

const FiscalYearContext = createContext<FiscalYearContextType | undefined>(undefined);

interface FiscalYearProviderProps {
  children: React.ReactNode;
  initialYear?: number;
}

export const FiscalYearProvider: React.FC<FiscalYearProviderProps> = ({ 
  children, 
  initialYear 
}) => {
  const [fiscalYear, setFiscalYearState] = useState<number>(initialYear ?? 0);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadFiscalYears = async () => {
      try {
        // Source-of-truth comes from API/DB (no local fallback generation).
        const res = await fetch('/api/stats');
        const json = await res.json();
        if (!json?.success) return;

        const apiFiscalYear: number = json.data?.fiscalYear;
        const apiAvailableYears: number[] = Array.isArray(json.data?.availableYears)
          ? json.data.availableYears
          : [];

        if (cancelled) return;

        setAvailableYears(apiAvailableYears);

        const stored =
          typeof window !== 'undefined' ? localStorage.getItem('kpi-selected-fiscal-year') : null;
        const storedYear = stored ? parseInt(stored) : NaN;
        const hasStoredYear = Number.isFinite(storedYear);

        const preferred =
          initialYear && apiAvailableYears.includes(initialYear)
            ? initialYear
            : hasStoredYear && apiAvailableYears.includes(storedYear)
              ? storedYear
              : apiFiscalYear;

        if (Number.isFinite(preferred)) {
          setFiscalYearState(preferred);
        }
      } catch {
        // If API is unavailable we keep current state; callers should handle missing years gracefully.
      }
    };

    loadFiscalYears();
    return () => {
      cancelled = true;
    };
  }, [initialYear]);

  // Update localStorage when fiscal year changes
  const setFiscalYear = (year: number) => {
    setFiscalYearState(year);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kpi-selected-fiscal-year', year.toString());
    }
  };

  const value: FiscalYearContextType = {
    fiscalYear,
    setFiscalYear,
    availableYears,
  };

  return (
    <FiscalYearContext.Provider value={value}>
      {children}
    </FiscalYearContext.Provider>
  );
};

export const useFiscalYear = () => {
  const context = useContext(FiscalYearContext);
  if (context === undefined) {
    throw new Error('useFiscalYear must be used within a FiscalYearProvider');
  }
  return context;
};

// Backward compatibility hook that uses the context
export function useFiscalYearSelector(initialYear?: number) {
  const context = useFiscalYear();
  
  // If initialYear is provided and different from context, update context
  React.useEffect(() => {
    if (initialYear && context.fiscalYear !== initialYear) {
      // Only set if no stored value (fresh load)
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('kpi-selected-fiscal-year');
        if (!stored) {
          context.setFiscalYear(initialYear);
        }
      }
    }
  }, [initialYear, context.fiscalYear]);

  return context;
}
