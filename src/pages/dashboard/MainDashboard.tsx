import React from 'react';
import { ShellLayout } from '@/features/shell';
import { Target, AlertTriangle, CheckCircle2, RefreshCw, CalendarDays } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';
import { MONTHS } from './constants';
import { useDashboardData } from './useDashboardData';
import { OverviewTab } from './OverviewTab';
import { DetailsTab } from './DetailsTab';
import { DepartmentsTab } from './DepartmentsTab';
import { CategoriesTab } from './CategoriesTab';

function MainDashboard({ initialCategory }: { initialCategory?: string } = {}) {
  const {
    fiscalYear,
    setFiscalYear,
    availableYears,
    selectedMonth,
    setSelectedMonth,
    selectedDept,
    setSelectedDept,
    selectedCategory,
    setSelectedCategory,
    categories,
    loading,
    kpiStatus,
    summary,
    departmentData,
    filteredAndSortedDetails,
    paginatedDetails,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    sortField,
    handleSort,
    sortDirection,
    categoryChartData,
    kpiData,
    calculateTotalTargets,
    calculateCategoryStats,
    refreshData,
  } = useDashboardData(initialCategory);

  // For MainDashboard (overview), always show all categories
  // Category-specific filtering is handled by CategoryDashboard
  const overviewMode = !initialCategory;
  const displayCategory = overviewMode ? 'all' : selectedCategory;

  const statusData = [
    {
      name: 'Complete',
      value: summary.completeDepts,
      color: 'bg-green-500',
      icon: CheckCircle2,
      pct: kpiStatus.length > 0 ? (summary.completeDepts / kpiStatus.length) * 100 : 0,
    },
    {
      name: 'In Progress',
      value: summary.partialDepts,
      color: 'bg-orange-500',
      icon: RefreshCw,
      pct: kpiStatus.length > 0 ? (summary.partialDepts / kpiStatus.length) * 100 : 0,
    },
    {
      name: 'Not Started',
      value: summary.missingDepts,
      color: 'bg-red-500',
      icon: AlertTriangle,
      pct: kpiStatus.length > 0 ? (summary.missingDepts / kpiStatus.length) * 100 : 0,
    },
  ];

  return (
    <ShellLayout>
      <StandardPageLayout
        title={
          overviewMode
            ? 'KPI Executive Dashboard'
            : `${categories.find((c) => c.key === selectedCategory)?.name || 'Category'} Dashboard`
        }
        subtitle={
          overviewMode
            ? `Complete KPI Performance Overview — FY ${fiscalYear}`
            : `${categories.find((c) => c.key === selectedCategory)?.name || 'Category'} Performance — FY ${fiscalYear}`
        }
        icon={Target}
        iconColor="text-blue-600"
        department={selectedDept === 'all' ? '' : selectedDept}
        fiscalYear={fiscalYear}
        availableYears={availableYears}
        onDepartmentChange={(value) => setSelectedDept(value === '' ? 'all' : value)}
        onFiscalYearChange={(value) => setFiscalYear(value)}
        onRefresh={refreshData}
        loading={loading}
        theme="blue"
        rightActions={
          <>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[120px] h-9 bg-blue-50 border-blue-200 text-blue-700 text-sm font-medium">
                <CalendarDays className="w-4 h-4 mr-2" />
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px] h-9 bg-gray-50 text-sm border-gray-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.key}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }>
        <div className="space-y-6">
          {/* Tabs: Overview / Details / Departments / Categories */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-muted/50 p-1 h-10">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white h-8 px-4 text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-white h-8 px-4 text-sm">
                Details
              </TabsTrigger>
              <TabsTrigger
                value="departments"
                className="data-[state=active]:bg-white h-8 px-4 text-sm">
                Departments
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="data-[state=active]:bg-white h-8 px-4 text-sm">
                Categories
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <OverviewTab
                kpiData={kpiData}
                calculateTotalTargets={calculateTotalTargets}
                calculateCategoryStats={calculateCategoryStats}
                selectedCategory={displayCategory}
                categories={categories}
              />
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <DetailsTab
                filteredAndSortedDetails={filteredAndSortedDetails}
                paginatedDetails={paginatedDetails}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                sortField={sortField}
                handleSort={handleSort}
                sortDirection={sortDirection}
              />
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments" className="space-y-4">
              <DepartmentsTab departmentData={departmentData} />
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-4">
              <CategoriesTab categoryChartData={categoryChartData} />
            </TabsContent>
          </Tabs>
        </div>
      </StandardPageLayout>
    </ShellLayout>
  );
}

export default MainDashboard;
