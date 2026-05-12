import React from 'react';
import { Target } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { COLORS } from '@/shared/constants/colors';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import { ShellLayout } from '@/components/layout';
import { CatCard, CAT } from '../shared';
import { useMonthlyTargetsData } from './useMonthlyTargetsData';
import { MonthlyTargetsTable } from './MonthlyTargetsTable';
import { BaseSection, BaseGrid } from '@/components/base/BaseComponent';

export function MonthlyTargetsPage() {
  const { toast } = useToast();
  const {
    categories,
    cat,
    setCat,
    fiscalYear,
    setFiscalYear,
    availableYears,
    dept,
    setDept,
    loading,
    statsLoading,
    searchQuery,
    setSearchQuery,
    categoryTargetValues,
    categoryTargetCounts,
    categoryResultCounts,
    filteredYearlyTargets,
    canEdit,
    getMonthlyTarget,
    getTargetStatus,
    saveMonthlyTarget,
    fillAllMonths,
    refreshData,
  } = useMonthlyTargetsData();

  const selectedCatName = categories.find((c) => c.key === cat)?.name ?? '';
  const selectedCatCfg = cat ? (CAT[cat] ?? { color: '#2563EB', icon: Target }) : null;

  return (
    <ShellLayout>
      <StandardPageLayout
        title={cat ? selectedCatName : 'Monthly Targets'}
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
                  categoryResultCounts={categoryResultCounts}
                  statsLoading={statsLoading}
                  onClick={() => setCat(c.key)}
                  catColor={CAT[c.key]?.color}
                />
              ))}
            </BaseGrid>
          </BaseSection>
        ) : (
          <MonthlyTargetsTable
            filteredYearlyTargets={filteredYearlyTargets || []}
            loading={loading}
            canEdit={canEdit}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            getMonthlyTarget={getMonthlyTarget}
            getTargetStatus={getTargetStatus}
            saveMonthlyTarget={saveMonthlyTarget}
            fillAllMonths={fillAllMonths}
            toast={toast}
            onRefreshData={refreshData}
          />
        )}
      </StandardPageLayout>
    </ShellLayout>
  );
}
