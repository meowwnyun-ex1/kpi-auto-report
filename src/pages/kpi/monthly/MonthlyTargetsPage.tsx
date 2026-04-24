import React from 'react';
import { Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { COLORS } from '@/constants/colors';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';
import { ShellLayout } from '@/features/shell';
import { CatCard } from '../shared';
import { useMonthlyTargetsData } from './useMonthlyTargetsData';
import { MonthlyTargetsTable } from './MonthlyTargetsTable';
import { BaseSection, BaseGrid } from '@/components/base/BaseComponent';

export default function MonthlyTargetsPage() {
  const { toast } = useToast();

  const {
    fiscalYear,
    setFiscalYear,
    availableYears,
    categories,
    cat,
    setCat,
    dept,
    setDept,
    loading,
    statsLoading,
    searchQuery,
    setSearchQuery,
    categoryTargetValues,
    categoryTargetCounts,
    canEdit,
    filteredYearlyTargets,
    saveMonthlyTarget,
    getMonthlyTarget,
    getTargetStatus,
    refreshData,
    fillAllMonths,
  } = useMonthlyTargetsData();

  const selectedCatName = categories.find((c) => c.key === cat)?.name ?? '';
  const selectedCatCfg = cat ? (CAT[cat] ?? { color: '#6B7280', icon: Target }) : null;

  return (
    <ShellLayout>
      <StandardPageLayout
        title={cat ? selectedCatName : 'Monthly Targets'}
        subtitle={undefined}
        icon={cat && selectedCatCfg ? selectedCatCfg.icon : Target}
        iconColor={cat && selectedCatCfg ? selectedCatCfg.color : COLORS.primary[600]}
        showBackButton={!!cat}
        onBackClick={() => setCat('')}
        department={dept}
        fiscalYear={fiscalYear}
        availableYears={availableYears}
        onDepartmentChange={(v) => {
          setDept(v);
          setCat('');
        }}
        onFiscalYearChange={(v) => {
          setFiscalYear(v);
          setCat('');
        }}
        onRefresh={refreshData}
        loading={statsLoading}
        theme="blue">
        {!cat ? (
          <BaseSection>
            <BaseGrid cols={4} gap="md" responsive={true}>
              {categories.map((c) => (
                <CatCard
                  key={c.id}
                  c={c}
                  categoryTargetValues={categoryTargetValues}
                  categoryTargetCounts={categoryTargetCounts}
                  statsLoading={statsLoading}
                  onClick={() => setCat(c.key)}
                />
              ))}
            </BaseGrid>
          </BaseSection>
        ) : (
          <div className="bg-gray-50/60">
            <MonthlyTargetsTable
              filteredYearlyTargets={filteredYearlyTargets}
              loading={loading}
              canEdit={canEdit}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              getMonthlyTarget={getMonthlyTarget}
              getTargetStatus={getTargetStatus}
              saveMonthlyTarget={saveMonthlyTarget}
              fillAllMonths={fillAllMonths}
              toast={toast}
            />
          </div>
        )}
      </StandardPageLayout>
    </ShellLayout>
  );
}
