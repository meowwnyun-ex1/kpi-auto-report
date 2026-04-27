import React from 'react';
import { StandardPageLayout } from './StandardPageLayout';
import { DeptYearSelector } from '@/components/kpi/DeptYearSelector';
import { BaseSection, BaseGrid } from '@/components/base/BaseComponent';

interface KpiPageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  theme?: 'blue' | 'emerald' | 'gray' | 'purple';

  // Common props
  department: string;
  fiscalYear: number;
  availableYears: number[];
  onDepartmentChange: (dept: string) => void;
  onFiscalYearChange: (year: number) => void;
  onRefresh: () => void;
  loading?: boolean;

  // Layout type
  layoutType?: 'standard' | 'step-by-step';
  selectedCategory?: string;

  // Navigation
  showBackButton?: boolean;
  onBackClick?: () => void;
}

/**
 * Unified KPI page layout component
 * Supports both standard and step-by-step layouts
 */
export function KpiPageLayout({
  children,
  title,
  subtitle,
  icon: Icon,
  iconColor,
  theme = 'blue',
  department,
  fiscalYear,
  availableYears,
  onDepartmentChange,
  onFiscalYearChange,
  onRefresh,
  loading = false,
  layoutType = 'standard',
  selectedCategory,
  showBackButton = false,
  onBackClick,
}: KpiPageLayoutProps) {
  // Step-by-step layout (for ActionPlans)
  if (layoutType === 'step-by-step') {
    return (
      <div className="flex flex-col h-full bg-gray-50/60">
        {/* Step-by-step content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Step 1: Category Selection */}
          <BaseSection>
            <BaseGrid cols={1} gap="md">
              {/* Category selector would go here */}
            </BaseGrid>
          </BaseSection>

          {/* Step 2: Department & Year */}
          <DeptYearSelector
            selectedDept={department}
            setSelectedDept={onDepartmentChange}
            selectedYear={fiscalYear}
            setSelectedYear={onFiscalYearChange}
            selectedCategory={selectedCategory || ''}
          />

          {/* Step 3: Main Content */}
          {children}
        </div>
      </div>
    );
  }

  // Standard layout (for most pages)
  return (
    <StandardPageLayout
      title={title}
      subtitle={subtitle}
      icon={Icon}
      iconColor={iconColor}
      showBackButton={showBackButton}
      onBackClick={onBackClick}
      department={department}
      fiscalYear={fiscalYear}
      availableYears={availableYears}
      onDepartmentChange={onDepartmentChange}
      onFiscalYearChange={onFiscalYearChange}
      onRefresh={onRefresh}
      loading={loading}
      theme={theme}>
      {children}
    </StandardPageLayout>
  );
}
