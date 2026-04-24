import React from 'react';
import { ShellLayout } from '@/features/shell';
import { Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';
import { CAT, CatCard } from '../shared';
import { useYearlyTargetsData } from './useYearlyTargetsData';
import { YearlyTargetsTable } from './YearlyTargetsTable';

export default function YearlyTargetsPage() {
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
    filteredRows,
    drafts,
    onChange,
    onNoteChange,
    onAttachmentChange,
    saveRow,
    refreshData,
    showAddModal,
    setShowAddModal,
    selectedMonth,
    setSelectedMonth,
    canEdit,
  } = useYearlyTargetsData();

  const selectedCatName = categories.find((c) => c.key === cat)?.name ?? '';
  const selectedCatCfg = cat ? (CAT[cat] ?? { color: '#6B7280', icon: Target }) : null;

  return (
    <ShellLayout>
      <StandardPageLayout
        title={cat ? selectedCatName : 'Yearly Targets'}
        subtitle={undefined}
        icon={cat && selectedCatCfg ? selectedCatCfg.icon : Target}
        iconColor={cat && selectedCatCfg ? selectedCatCfg.color : 'text-gray-600'}
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
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((c) => (
                <CatCard
                  key={c.id}
                  c={c}
                  categoryTargetValues={categoryTargetValues}
                  statsLoading={statsLoading}
                  onClick={() => setCat(c.key)}
                  catColor={CAT[c.key]?.color}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 bg-gray-50/60">
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
          </div>
        )}
      </StandardPageLayout>
    </ShellLayout>
  );
}
