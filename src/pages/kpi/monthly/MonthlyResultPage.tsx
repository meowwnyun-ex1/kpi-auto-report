import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useFiscalYearSelector } from '@/contexts/FiscalYearContext';
import { COLORS } from '@/shared/constants/colors';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import { ShellLayout } from '@/components/layout';
import { CatCard, CAT } from '../shared';
import { useMonthlyResultData } from './useMonthlyResultData';
import { MonthlyResultTable } from './MonthlyResultTable';
import { BaseSection, BaseGrid } from '@/components/base/BaseComponent';

export default function MonthlyResultPage() {
  const { toast } = useToast();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();

  const {
    user,
    categories,
    cat,
    setCat,
    rows,
    depts,
    dept,
    setDept,
    loading,
    stats,
    statsLoading,
    searchQuery,
    setSearchQuery,
    categoryTargetValues,
    categoryTargetCounts,
    categoryActualCounts,
    filteredRows,
    canEdit,
    onChangeResult,
    saveMonthResult,
    refreshData,
  } = useMonthlyResultData(fiscalYear, setFiscalYear);

  const selectedCatName = categories.find((c) => c.key === cat)?.name ?? '';
  const selectedCatCfg = cat ? (CAT[cat] ?? { color: '#059669', icon: Target }) : null;

  return (
    <ShellLayout>
      <StandardPageLayout
        title={cat ? selectedCatName : 'Monthly Results'}
        icon={cat && selectedCatCfg ? selectedCatCfg.icon : Target}
        iconColor={cat && selectedCatCfg ? selectedCatCfg.color : COLORS.success[600]}
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
        theme="emerald">
        {!cat ? (
          <BaseSection>
            <BaseGrid cols={4} gap="md" responsive={true}>
              {categories.map((c) => (
                <CatCard
                  key={c.id}
                  c={c}
                  categoryTargetValues={categoryTargetValues}
                  categoryTargetCounts={categoryTargetCounts}
                  categoryActualCounts={categoryActualCounts}
                  statsLoading={statsLoading}
                  onClick={() => setCat(c.key)}
                  catColor={CAT[c.key]?.color}
                />
              ))}
            </BaseGrid>
          </BaseSection>
        ) : (
          <div className="flex-1 p-6 bg-gray-50/60">
            <MonthlyResultTable
              filteredRows={filteredRows}
              loading={loading}
              canEdit={canEdit}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCatName={selectedCatName}
              onChangeResult={onChangeResult}
              saveMonthResult={saveMonthResult}
              toast={toast}
            />
          </div>
        )}
      </StandardPageLayout>
    </ShellLayout>
  );
}
