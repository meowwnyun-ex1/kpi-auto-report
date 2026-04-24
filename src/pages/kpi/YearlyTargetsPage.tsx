import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { ShellLayout } from '@/features/shell';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';
import { TableContainer } from '@/components/shared/TableContainer';
import { CatCard } from '../shared/CatCard';
import { AddTargetModal } from '../shared/AddTargetModal';
import { AttachmentPanel } from '@/components/kpi/AttachmentPanel';
import { useYearlyTargetsData } from '../yearly/useYearlyTargetsData';
import { PriorityStatus } from '@/components/kpi/priority-status';
import { BaseSection, BaseGrid } from '@/components/base/BaseComponent';
import { useToast } from '@/hooks/use-toast';

// Types
interface Category {
  id: number;
  name: string;
  key: string;
}

interface YearlyTarget {
  id: number;
  category_id: number;
  measurement: string | null;
  unit: string | null;
  main: string | null;
  main_relate_display: string | null;
  fy_target: number | null;
  total_target: number;
  used_quota: number;
  remaining_quota: number;
  description_of_target: string | null;
  saving?: boolean;
  dirty?: boolean;
}

interface Stats {
  yearly: number;
  months: Record<number, { targets: { set: number } }>;
}

// Constants
const MONTHS = [
  { value: 'all', label: 'All Months' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
];

// Category icons with priority colors
const CAT: Record<string, { icon: React.ComponentType<{ className?: string }> }> = {
  safety: { icon: Shield },
  quality: { icon: Award },
  delivery: { icon: Truck },
  compliance: { icon: FileCheck },
  hr: { icon: Users },
  attractive: { icon: Star },
  environment: { icon: Leaf },
  cost: { icon: DollarSign },
};

export default function YearlyTargetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYear();

  const {
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
    showAddModal,
    setShowAddModal,
    searchQuery,
    setSearchQuery,
    selectedMonth,
    setSelectedMonth,
    drafts,
    setDrafts,
    categoryTargetValues,
    categoryTargetCounts,
    canEdit,
    filteredRows,
    onChange,
    onNoteChange,
    onAttachmentChange,
    saveRow,
    refreshData,
  } = useYearlyTargetsData();

  const selectedCatName = categories.find((c) => c.key === cat)?.name ?? '';
  const selectedCatCfg = cat ? CAT[cat] || { icon: Target } : null;

  // Status chip using priority-based colors
  const StatusChip = ({ row }: { row: YearlyTarget }) => {
    if (row.saving)
      return (
        <PriorityStatus
          status="in_progress"
          label="Saving"
          size="sm"
          variant="badge"
          showIcon={false}
          className="animate-pulse"
        />
      );
    if (row.dirty)
      return <PriorityStatus status="pending" label="Edited" size="sm" variant="badge" />;
    return <PriorityStatus status="active" size="sm" variant="badge" />;
  };

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
          /* Category grid */
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
                  catColor={CAT[c.key]?.color || '#6B7280'}
                />
              ))}
            </BaseGrid>
          </BaseSection>
        ) : (
          /* Yearly targets table */
          <div className="flex-1 p-6 bg-gray-50/60">
            {loading ? (
              <TableContainer
                icon={Target}
                title="Yearly Targets"
                subtitle="Set yearly targets and distribute to departments"
                theme="gray"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by measurement..."
                loading
              />
            ) : filteredRows.length === 0 ? (
              <TableContainer
                icon={Target}
                title="Yearly Targets"
                subtitle="Set yearly targets and distribute to departments"
                theme="gray"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by measurement..."
                empty
                emptyTitle="No KPIs found"
                emptyDescription={`No yearly targets found for ${selectedCatName}. Create yearly targets to set annual KPI goals.`}
              />
            ) : (
              <TableContainer
                icon={Target}
                title="Yearly Targets"
                totalCount={filteredRows.length}
                countUnit="target"
                theme="gray"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by measurement..."
                searchActions={
                  <>
                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={(v) => setSelectedMonth(v === 'all' ? 'all' : parseInt(v))}>
                      <SelectTrigger className="w-[120px] h-9 bg-gray-50 border-gray-200 text-sm">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value.toString()}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {canEdit && (
                      <Button
                        size="sm"
                        className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setShowAddModal(true)}>
                        <Target className="w-3.5 h-3.5 mr-1.5" />
                        Add New Target
                      </Button>
                    )}
                  </>
                }>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="w-16 bg-gray-100 pl-6 text-xs font-bold text-gray-700">
                          #
                        </TableHead>
                        <TableHead className="text-xs font-bold text-gray-700 min-w-[200px] bg-gray-100 py-4">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-gray-600" />
                            Measurement
                          </div>
                        </TableHead>
                        <TableHead className="w-24 text-right text-xs font-bold text-gray-700 bg-gray-100 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Target
                          </div>
                        </TableHead>
                        <TableHead className="w-24 text-center text-xs font-bold text-gray-700 bg-gray-100 py-4">
                          Unit
                        </TableHead>
                        <TableHead className="w-20 text-center text-xs font-bold text-gray-700 bg-gray-100 py-4">
                          Main
                        </TableHead>
                        <TableHead className="min-w-[120px] text-center text-xs font-bold text-gray-700 bg-gray-100 py-4">
                          Related
                        </TableHead>
                        <TableHead className="w-32 text-center text-xs font-bold text-gray-700 bg-gray-100 py-4">
                          Status
                        </TableHead>
                        <TableHead className="w-16 text-center text-xs font-bold text-gray-700 bg-gray-100 pr-6 py-4">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.map((row, i) => (
                        <React.Fragment key={row.id}>
                          <TableRow className="border-b border-gray-200 hover:bg-gray-50 transition-colors group">
                            <TableCell className="text-center text-xs font-mono text-gray-400 font-bold pl-6 py-4 bg-gray-50/50">
                              {i + 1}
                            </TableCell>
                            <TableCell className="py-4">
                              <p className="text-sm text-gray-700 leading-tight">
                                {row.measurement ?? '---'}
                              </p>
                            </TableCell>
                            <TableCell className="text-right py-4 bg-gray-50/50">
                              <div className="text-right">
                                <div className="font-mono text-sm font-bold text-blue-600">
                                  {row.total_target.toLocaleString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4 bg-gray-50/50">
                              <div className="text-center">
                                <div className="font-mono text-sm font-bold text-gray-700">
                                  {row.unit || '---'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4 bg-gray-50/50">
                              <div className="text-center">
                                <div className="font-mono text-sm font-bold text-gray-700">
                                  {row.main || '---'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4 bg-gray-50/50">
                              <div className="text-center">
                                <div className="font-mono text-sm font-bold text-gray-700">
                                  {row.main_relate_display?.includes('All')
                                    ? 'All'
                                    : row.main_relate_display || '---'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <StatusChip row={row} />
                            </TableCell>
                            <TableCell className="text-center pr-6 py-4">
                              {canEdit && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                                  onClick={() => saveRow(row)}
                                  disabled={row.saving}>
                                  {row.saving ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TableContainer>
            )}
          </div>
        )}
      </StandardPageLayout>

      {/* Add Target Modal */}
      {cat && (
        <AddTargetModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          categoryId={categories.find((c) => c.key === cat)?.id ?? 0}
          categoryName={selectedCatName}
          onSuccess={() => {
            loadRows();
            loadStats();
          }}
        />
      )}
    </ShellLayout>
  );
}
