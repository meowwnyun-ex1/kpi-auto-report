import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface FiscalYearContextType {
  fiscalYear: number;
  setFiscalYear: (year: number) => void;
  availableYears: number[];
  setAvailableYears: (years: number[]) => void;
}

const FiscalYearContext = createContext<FiscalYearContextType | undefined>(undefined);

// Get current fiscal year (Thai fiscal year starts April)
const getCurrentFiscalYear = (): number => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  return currentMonth >= 4 ? now.getFullYear() : now.getFullYear() - 1;
};

export const FiscalYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fiscalYear, setFiscalYearState] = useState<number>(() => {
    // Check localStorage first, then use current fiscal year
    const saved = localStorage.getItem('kpi-fiscal-year');
    if (saved) {
      const savedYear = parseInt(saved);
      if (!isNaN(savedYear) && savedYear >= 2020 && savedYear <= 2100) {
        return savedYear;
      }
    }
    return getCurrentFiscalYear();
  });
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const setFiscalYear = useCallback((year: number) => {
    setFiscalYearState(year);
    // Persist to localStorage
    localStorage.setItem('kpi-fiscal-year', year.toString());
  }, []);

  return (
    <FiscalYearContext.Provider
      value={{ fiscalYear, setFiscalYear, availableYears, setAvailableYears }}>
      {children}
    </FiscalYearContext.Provider>
  );
};

export const useFiscalYear = (): FiscalYearContextType => {
  const context = useContext(FiscalYearContext);
  if (context === undefined) {
    throw new Error('useFiscalYear must be used within a FiscalYearProvider');
  }
  return context;
};

export default FiscalYearContext;
