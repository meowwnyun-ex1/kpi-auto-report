import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tag,
  FolderOpen,
  Target,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';
import { TableContainer, TABLE_STYLES } from '@/shared/components/TableContainer';

interface KPIOverviewProps {
  activeTab: string;
  activeCategory: string | null;
  activeSubcategory: string | null;
  categories: any[];
  subcategories: any[];
  measurements: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  canEdit: boolean;
  loading?: boolean;
  onCategorySelect: (key: string) => void;
  onSubcategorySelect: (key: string) => void;
  onEdit: (
    type: 'category' | 'subcategory' | 'measurement',
    category?: string,
    subcategory?: string
  ) => void;
  onAdd: (type: 'category' | 'subcategory' | 'measurement') => void;
}

export function KPIOverview({
  activeTab,
  activeCategory,
  activeSubcategory,
  categories,
  subcategories,
  measurements,
  searchTerm,
  setSearchTerm,
  canEdit,
  onCategorySelect,
  onSubcategorySelect,
  onEdit,
  onAdd,
  loading = false,
}: KPIOverviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter data based on search term
  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredSubcategories = subcategories.filter((sub) =>
    sub.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredMeasurements = measurements.filter((meas) =>
    meas.measurement?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'overview':
      case 'categories':
        return {
          data: filteredCategories,
          total: filteredCategories.length,
          icon: Tag,
          title: 'KPI Category Management',
          theme: 'blue' as const,
          columns: [
            { key: 'no', label: '#', width: 'w-12', align: 'text-center' },
            { key: 'name', label: 'Category Name', width: 'w-64', align: 'text-left' },
            { key: 'key', label: 'Key Code', width: 'w-32', align: 'text-center' },
            { key: 'description', label: 'Description', width: 'flex-1', align: 'text-left' },
            { key: 'status', label: 'Status', width: 'w-28', align: 'text-center' },
            { key: 'actions', label: 'Actions', width: 'w-24', align: 'text-center' },
          ],
        };
      case 'subcategory':
        return {
          data: filteredSubcategories,
          total: filteredSubcategories.length,
          icon: FolderOpen,
          title: 'KPI Subcategory Registry',
          theme: 'purple' as const,
          columns: [
            { key: 'no', label: '#', width: 'w-12', align: 'text-center' },
            { key: 'name', label: 'Subcategory Name', width: 'w-64', align: 'text-left' },
            { key: 'category', label: 'Parent Category', width: 'w-48', align: 'text-left' },
            { key: 'created', label: 'Created Date', width: 'w-36', align: 'text-center' },
            { key: 'actions', label: 'Actions', width: 'w-24', align: 'text-center' },
          ],
        };
      case 'measurement':
        return {
          data: filteredMeasurements,
          total: filteredMeasurements.length,
          icon: Target,
          title: 'KPI Measurement Definitions',
          theme: 'emerald' as const,
          columns: [
            { key: 'no', label: '#', width: 'w-12', align: 'text-center' },
            { key: 'name', label: 'Measurement Name', width: 'w-72', align: 'text-left' },
            { key: 'unit', label: 'Unit Type', width: 'w-32', align: 'text-center' },
            { key: 'category', label: 'Category', width: 'w-40', align: 'text-left' },
            { key: 'subcategory', label: 'Subcategory', width: 'w-40', align: 'text-left' },
            { key: 'actions', label: 'Actions', width: 'w-24', align: 'text-center' },
          ],
        };
      default:
        return {
          data: [],
          total: 0,
          icon: Tag,
          title: 'Data Overview',
          theme: 'blue' as const,
          columns: [
            { key: 'no', label: '#', width: 'w-12', align: 'text-center' },
            { key: 'name', label: 'Item Name', width: 'flex-1', align: 'text-left' },
            { key: 'actions', label: 'Actions', width: 'w-24', align: 'text-center' },
          ],
        };
    }
  };

  const { data, total, icon: Icon, title, theme, columns } = getCurrentData();

  // Pagination
  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  // Render row based on active tab
  const renderRow = (item: any, index: number) => {
    const rowNumber = startIndex + index + 1;
    const isEvenRow = rowNumber % 2 === 0;

    switch (activeTab) {
      case 'overview':
      case 'categories':
        return (
          <>
            <TableCell
              className={`text-center py-3 px-2 font-medium text-gray-600 ${isEvenRow ? 'bg-gray-50/50' : 'bg-white'}`}>
              {rowNumber}
            </TableCell>
            <TableCell
              className={`py-3 px-4 font-medium text-gray-900 ${isEvenRow ? 'bg-gray-50/50' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: item.color || '#6b7280' }}
                />
                <div className="font-semibold">{item.name}</div>
              </div>
            </TableCell>
            <TableCell
              className={`text-center py-3 px-3 ${isEvenRow ? 'bg-gray-50/50' : 'bg-white'}`}>
              <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                {item.key || '-'}
              </Badge>
            </TableCell>
            <TableCell
              className={`py-3 px-4 text-sm text-gray-600 ${isEvenRow ? 'bg-gray-50/50' : 'bg-white'}`}>
              <div className="line-clamp-2" title={item.description}>
                {item.description || '-'}
              </div>
            </TableCell>
            <TableCell
              className={`text-center py-3 px-3 ${isEvenRow ? 'bg-gray-50/50' : 'bg-white'}`}>
              <Badge
                variant={item.is_active ? 'default' : 'secondary'}
                className={`text-xs px-2 py-1 font-medium ${
                  item.is_active
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell
              className={`text-center py-3 px-2 ${isEvenRow ? 'bg-gray-50/50' : 'bg-white'}`}>
              <div className="flex items-center justify-center gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
                    onClick={() => onEdit('category')}>
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-50">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </>
        );

      case 'subcategory':
        return (
          <>
            <TableCell
              className={`text-center py-3 px-2 font-medium text-gray-600 ${isEvenRow ? 'bg-purple-50/30' : 'bg-white'}`}>
              {rowNumber}
            </TableCell>
            <TableCell
              className={`py-3 px-4 font-medium text-gray-900 ${isEvenRow ? 'bg-purple-50/30' : 'bg-white'}`}>
              <div className="font-semibold">{item.name}</div>
            </TableCell>
            <TableCell className={`py-3 px-4 ${isEvenRow ? 'bg-purple-50/30' : 'bg-white'}`}>
              <Badge variant="outline" className="text-xs px-2 py-1">
                {item.category_name || 'N/A'}
              </Badge>
            </TableCell>
            <TableCell
              className={`text-center py-3 px-3 text-sm text-gray-500 ${isEvenRow ? 'bg-purple-50/30' : 'bg-white'}`}>
              {item.created_at
                ? new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '-'}
            </TableCell>
            <TableCell
              className={`text-center py-3 px-2 ${isEvenRow ? 'bg-purple-50/30' : 'bg-white'}`}>
              <div className="flex items-center justify-center gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-purple-50 text-purple-600"
                    onClick={() => onEdit('subcategory')}>
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-50">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </>
        );

      case 'measurement':
        return (
          <>
            <TableCell
              className={`text-center py-3 px-2 font-medium text-gray-600 ${isEvenRow ? 'bg-emerald-50/30' : 'bg-white'}`}>
              {rowNumber}
            </TableCell>
            <TableCell
              className={`py-3 px-4 font-medium text-gray-900 ${isEvenRow ? 'bg-emerald-50/30' : 'bg-white'}`}>
              <div className="font-semibold">{item.measurement || item.name}</div>
            </TableCell>
            <TableCell
              className={`text-center py-3 px-3 ${isEvenRow ? 'bg-emerald-50/30' : 'bg-white'}`}>
              <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                {item.unit || '-'}
              </Badge>
            </TableCell>
            <TableCell className={`py-3 px-4 ${isEvenRow ? 'bg-emerald-50/30' : 'bg-white'}`}>
              <Badge variant="outline" className="text-xs px-2 py-1">
                {item.category_name || 'N/A'}
              </Badge>
            </TableCell>
            <TableCell className={`py-3 px-4 ${isEvenRow ? 'bg-emerald-50/30' : 'bg-white'}`}>
              <Badge variant="outline" className="text-xs px-2 py-1">
                {item.subcategory_name || 'N/A'}
              </Badge>
            </TableCell>
            <TableCell
              className={`text-center py-3 px-2 ${isEvenRow ? 'bg-emerald-50/30' : 'bg-white'}`}>
              <div className="flex items-center justify-center gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-emerald-50 text-emerald-600"
                    onClick={() => onEdit('measurement')}>
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-50">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </>
        );

      default:
        return null;
    }
  };

  const getHeaderGradient = () => {
    switch (theme) {
      case 'blue':
        return 'bg-gradient-to-r from-blue-50 to-indigo-100';
      case 'purple':
        return 'bg-gradient-to-r from-purple-50 to-violet-100';
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-50 to-green-100';
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-100';
    }
  };

  const getHeaderCellBg = () => {
    switch (theme) {
      case 'blue':
        return 'bg-blue-50';
      case 'purple':
        return 'bg-purple-50';
      case 'emerald':
        return 'bg-emerald-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getRowHover = () => {
    switch (theme) {
      case 'blue':
        return 'hover:bg-blue-50/30';
      case 'purple':
        return 'hover:bg-purple-50/30';
      case 'emerald':
        return 'hover:bg-emerald-50/30';
      default:
        return 'hover:bg-gray-50/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <TableContainer
      icon={Icon}
      title={title}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder={`Search ${title.toLowerCase()}...`}
      searchActions={
        <Button
          size="sm"
          variant="outline"
          className="h-9"
          onClick={() =>
            onAdd(activeTab.slice(0, -1) as 'category' | 'subcategory' | 'measurement')
          }>
          <Plus className="h-4 w-4 mr-1" />
          Add {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
        </Button>
      }
      pagination={{
        currentPage,
        totalPages: Math.ceil(total / itemsPerPage),
        totalItems: total,
        itemsPerPage,
        onPageChange: setCurrentPage,
        onItemsPerPageChange: setItemsPerPage,
      }}
      theme={theme}
      loading={loading}
      empty={total === 0}
      emptyTitle={`No ${title.toLowerCase()} found`}
      emptyDescription={searchTerm ? 'Try adjusting your search terms.' : 'No data available.'}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className={`${getHeaderGradient()} sticky top-0 z-10`}>
            <TableRow className={TABLE_STYLES.headerRow}>
              {columns.map((col, idx) => (
                <TableHead
                  key={col.key}
                  className={`${col.width} ${getHeaderCellBg()} ${TABLE_STYLES.headerCell} ${col.align} ${
                    col.key === 'no' ? 'pl-6' : ''
                  } ${col.key === 'actions' ? 'pr-6' : ''}`}>
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.key === 'name' && <ChevronDown className="w-4 h-4 opacity-50" />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, idx) => (
              <TableRow key={item.id || idx} className={`${TABLE_STYLES.dataRow} ${getRowHover()}`}>
                {renderRow(item, (currentPage - 1) * itemsPerPage + idx)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}

export default KPIOverview;
