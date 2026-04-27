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
  // Get stored year from localStorage or use initial/current year
  const [fiscalYear, setFiscalYearState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kpi-selected-fiscal-year');
      if (stored) {
        const year = parseInt(stored);
        if (!isNaN(year)) return year;
      }
    }
    return initialYear || new Date().getFullYear();
  });

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
