import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Target,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Table as TableIcon,
  Grid3X3,
} from 'lucide-react';
import { TableContainer, TABLE_STYLES } from '@/shared/components/TableContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type SortField } from './constants';

interface DetailsTabProps {
  filteredAndSortedDetails: any[];
  paginatedDetails: any[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  currentPage: number;
  setCurrentPage: (v: number) => void;
  totalPages: number;
  itemsPerPage: number;
  setItemsPerPage: (v: number) => void;
  sortField: SortField;
  handleSort: (field: SortField) => void;
  sortDirection: 'asc' | 'desc';
}

export function DetailsTab({
  filteredAndSortedDetails,
  paginatedDetails,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
  sortField,
  handleSort,
  sortDirection,
}: DetailsTabProps) {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Performance Details</h3>
              <Badge variant="outline" className="text-xs">
                {filteredAndSortedDetails.length} items
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 w-64"
                />
              </div>
              {searchQuery && (
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 h-10 w-fit">
          <TabsTrigger
            value="table"
            className="data-[state=active]:bg-white h-8 px-4 text-sm flex items-center gap-2">
            <TableIcon className="w-4 h-4" />
            Table
          </TabsTrigger>
          <TabsTrigger
            value="cards"
            className="data-[state=active]:bg-white h-8 px-4 text-sm flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Cards
          </TabsTrigger>
        </TabsList>

        {/* Table Tab */}
        <TabsContent value="table" className="space-y-4">
          <Card>
            <TableContainer
              icon={Target}
              title="Performance Details"
              totalCount={filteredAndSortedDetails.length}
              countUnit="item"
              theme="blue"
              pagination={{
                currentPage,
                totalPages,
                totalItems: filteredAndSortedDetails.length,
                itemsPerPage,
                onPageChange: setCurrentPage,
                onItemsPerPageChange: setItemsPerPage,
              }}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 sticky top-0 z-10">
                    <TableRow className={TABLE_STYLES.headerRow}>
                      <TableHead
                        className={`flex-shrink-0 w-12 bg-blue-50 ${TABLE_STYLES.headerCell} pl-6`}>
                        #
                      </TableHead>
                      <TableHead
                        className={`bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[150px] flex-shrink-0 cursor-pointer hover:bg-blue-100`}
                        onClick={() => handleSort('department')}>
                        <div className="flex items-center gap-1">
                          Department{getSortIcon('department')}
                        </div>
                      </TableHead>
                      <TableHead
                        className={`bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[200px] flex-shrink-0 cursor-pointer hover:bg-blue-100`}
                        onClick={() => handleSort('measurement')}>
                        <div className="flex items-center gap-1">
                          Measurement{getSortIcon('measurement')}
                        </div>
                      </TableHead>
                      <TableHead
                        className={`bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[120px] flex-shrink-0`}>
                        Subcategory
                      </TableHead>
                      <TableHead
                        className={`bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[100px] flex-shrink-0`}>
                        Unit
                      </TableHead>
                      <TableHead
                        className={`text-right bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[100px] flex-shrink-0 cursor-pointer hover:bg-blue-100`}
                        onClick={() => handleSort('target')}>
                        <div className="flex items-center justify-end gap-1">
                          Target{getSortIcon('target')}
                        </div>
                      </TableHead>
                      <TableHead
                        className={`text-right bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[100px] flex-shrink-0 cursor-pointer hover:bg-blue-100`}
                        onClick={() => handleSort('result')}>
                        <div className="flex items-center justify-end gap-1">
                          Result{getSortIcon('result')}
                        </div>
                      </TableHead>
                      <TableHead
                        className={`text-right bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[100px] flex-shrink-0 cursor-pointer hover:bg-blue-100`}
                        onClick={() => handleSort('rate')}>
                        <div className="flex items-center justify-end gap-1">
                          Rate{getSortIcon('rate')}
                        </div>
                      </TableHead>
                      <TableHead
                        className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[80px] flex-shrink-0 cursor-pointer hover:bg-blue-100`}
                        onClick={() => handleSort('status')}>
                        <div className="flex items-center justify-center gap-1">
                          Status{getSortIcon('status')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDetails.map((row: any, idx: number) => (
                      <TableRow
                        key={`${row.department_name}-${row.measurement}-${idx}`}
                        className={TABLE_STYLES.dataRow}>
                        <TableCell
                          className={`${TABLE_STYLES.rowNumber} bg-blue-50/50 flex-shrink-0 w-12`}>
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </TableCell>
                        <TableCell className="font-medium py-4 bg-white min-w-[150px] flex-shrink-0">
                          {row.department_name}
                        </TableCell>
                        <TableCell className="py-4 bg-gray-50/30 min-w-[200px] flex-shrink-0">
                          <div>
                            <div className="font-medium">{row.measurement}</div>
                            <div className="text-xs text-gray-500">
                              {row.category_name && <span>{row.category_name}</span>}
                              {row.category_name && row.sub_category_name && <span> • </span>}
                              {row.sub_category_name && <span>{row.sub_category_name}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm py-4 bg-white min-w-[120px] flex-shrink-0">
                          <div className="text-sm text-gray-600">
                            {row.sub_category_name || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm py-4 bg-white min-w-[100px] flex-shrink-0">
                          {row.unit || '-'}
                        </TableCell>
                        <TableCell
                          className={`text-right py-4 bg-gray-50/30 ${TABLE_STYLES.numericCell} min-w-[100px] flex-shrink-0`}>
                          {row.target?.toLocaleString() || '-'}
                        </TableCell>
                        <TableCell
                          className={`text-right py-4 bg-white ${TABLE_STYLES.numericCell} min-w-[100px] flex-shrink-0`}>
                          {row.result?.toLocaleString() || '-'}
                        </TableCell>
                        <TableCell
                          className={`text-right py-4 bg-gray-50/30 ${TABLE_STYLES.numericCell} min-w-[100px] flex-shrink-0`}>
                          {row.target > 0
                            ? `${(((row.result || 0) / row.target) * 100).toFixed(2)}%`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-center py-4 bg-white min-w-[80px] flex-shrink-0">
                          {row.result != null ? (
                            <Badge
                              className={
                                row.ev === 'O'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }>
                              {row.ev}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TableContainer>
          </Card>
        </TabsContent>

        {/* Cards Tab */}
        <TabsContent value="cards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedDetails.map((row: any, idx: number) => {
              const rate = row.target > 0 ? ((row.result || 0) / row.target) * 100 : 0;
              const isAchieved = row.ev === 'O';
              const isMissed = row.ev === 'X';

              return (
                <Card
                  key={`${row.department_name}-${row.measurement}-${idx}`}
                  className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900 truncate max-w-[150px]">
                            {row.measurement}
                          </h4>
                          <p className="text-xs text-gray-500">{row.department_name}</p>
                        </div>
                      </div>
                      {row.result != null ? (
                        <Badge
                          className={
                            isAchieved
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }>
                          {isAchieved ? 'Achieved' : 'Missed'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Pending
                        </Badge>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-500">Target</div>
                        <div className="font-mono font-bold text-gray-700 text-sm">
                          {row.target?.toLocaleString() || '-'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-500">Result</div>
                        <div className="font-mono font-bold text-sm text-blue-600">
                          {row.result?.toLocaleString() || '-'}
                        </div>
                      </div>
                    </div>

                    {/* Achievement Rate */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Achievement Rate</span>
                        <span
                          className={`text-xs font-medium ${rate >= 95 ? 'text-green-600' : rate >= 75 ? 'text-blue-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {row.target > 0 ? `${rate.toFixed(2)}%` : '-'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            rate >= 95
                              ? 'bg-green-500'
                              : rate >= 75
                                ? 'bg-blue-500'
                                : rate >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(rate, 100)}%` }}></div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {row.unit && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Unit</span>
                          <span className="font-medium text-gray-700">{row.unit}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination for Cards */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredAndSortedDetails.length)} of{' '}
              {filteredAndSortedDetails.length} items
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}>
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}>
                Next
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
