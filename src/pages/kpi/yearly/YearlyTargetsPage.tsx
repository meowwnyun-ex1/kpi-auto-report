import React from 'react';
import { Target } from 'lucide-react';
import { ShellLayout } from '@/components/layout';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import { CatCard, CAT } from '../shared';
import { YearlyTargetsTable } from './YearlyTargetsTable';
import { BaseSection, BaseGrid } from '@/components/base/BaseComponent';
import { useToast } from '@/shared/hooks/use-toast';
import { COLORS } from '@/shared/constants/colors';
import { useYearlyTargetsData } from './useYearlyTargetsData';
import { useFiscalYearSelector } from '@/shared/hooks/useFiscalYearSelector';

export default function YearlyTargetsPage() {
  const toast = useToast();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();

  const {
    categories,
    cat,
    setCat,
    dept,
    setDept,
    loading,
    statsLoading,
    searchQuery,
    setSearchQuery,
    selectedMonth,
    setSelectedMonth,
    drafts,
    categoryTargetValues,
    categoryTargetCounts,
    canEdit,
    filteredRows,
    onChange,
    onNoteChange,
    onAttachmentChange,
    saveRow,
    showAddModal,
    setShowAddModal,
    refreshData,
  } = useYearlyTargetsData(fiscalYear, setFiscalYear);

  const selectedCatName = Array.isArray(categories)
    ? (categories.find((c) => c.key === cat)?.name ?? '')
    : '';
  const selectedCatCfg = cat ? (CAT[cat] ?? { color: '#6B7280', icon: Target }) : null;

  return (
    <ShellLayout>
      <StandardPageLayout
        title={cat ? selectedCatName : 'Yearly Targets'}
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
        theme="gray">
        {!cat ? (
          <BaseSection>
            <BaseGrid cols={4} gap="md" responsive={true}>
              {Array.isArray(categories) &&
                categories.map((c) => (
                  <CatCard
                    key={c.id}
                    c={c}
                    categoryTargetValues={categoryTargetValues}
                    categoryTargetCounts={categoryTargetCounts}
                    categoryActualCounts={{}}
                    statsLoading={statsLoading}
                    onClick={() => setCat(c.key)}
                    catColor={CAT[c.key]?.color}
                  />
                ))}
            </BaseGrid>
          </BaseSection>
        ) : (
          <YearlyTargetsTable
            filteredRows={filteredRows}
            loading={loading}
            canEdit={canEdit}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            drafts={drafts}
            onChange={onChange}
            onNoteChange={onNoteChange}
            onAttachmentChange={onAttachmentChange}
            saveRow={saveRow}
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            selectedCatName={selectedCatName}
            categories={categories}
            cat={cat}
            toast={toast}
          />
        )}
      </StandardPageLayout>
    </ShellLayout>
  );
}
