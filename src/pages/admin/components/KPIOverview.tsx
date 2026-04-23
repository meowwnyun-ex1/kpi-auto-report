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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { TableContainer, TABLE_STYLES } from '@/components/shared/TableContainer';

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
  // Pagination state for each table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Pagination functions
  const paginate = (items: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.max(
    Math.ceil(filteredCategories.length / itemsPerPage),
    Math.ceil(filteredSubcategories.length / itemsPerPage),
    Math.ceil(filteredMeasurements.length / itemsPerPage)
  );

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'categories':
        return {
          data: paginate(filteredCategories, currentPage),
          total: filteredCategories.length,
          icon: Tag,
          title: 'KPI Categories',
          theme: 'blue' as const,
          columns: ['Name', 'Key', 'Actions'],
        };
      case 'subcategories':
        return {
          data: paginate(filteredSubcategories, currentPage),
          total: filteredSubcategories.length,
          icon: FolderOpen,
          title: 'KPI Subcategories',
          theme: 'purple' as const,
          columns: ['Name', 'Category', 'Actions'],
        };
      case 'measurements':
        return {
          data: paginate(filteredMeasurements, currentPage),
          total: filteredMeasurements.length,
          icon: Target,
          title: 'KPI Measurements',
          theme: 'emerald' as const,
          columns: ['Measurement', 'Unit', 'Category', 'Subcategory', 'Actions'],
        };
      default:
        return null;
    }
  };

  const currentData = getCurrentData();

  if (!currentData) {
    return null;
  }

  const { data, total, icon: Icon, title, theme, columns } = currentData;

  const renderRow = (item: any, index: number) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;

    switch (activeTab) {
      case 'categories':
        return (
          <>
            <TableCell className={`${TABLE_STYLES.rowNumber} bg-blue-50/50`}>
              {globalIndex}
            </TableCell>
            <TableCell className="font-medium py-4 bg-white">{item.name}</TableCell>
            <TableCell className="font-mono text-sm py-4 bg-gray-50/30">{item.key}</TableCell>
            <TableCell className={`${TABLE_STYLES.actionCell} bg-gray-50/30`}>
              <div className="flex items-center gap-1">
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit('category')}>
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {canEdit && (
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </>
        );

      case 'subcategories':
        return (
          <>
            <TableCell className={`${TABLE_STYLES.rowNumber} bg-purple-50/50`}>
              {globalIndex}
            </TableCell>
            <TableCell className="font-medium py-4 bg-white">{item.name}</TableCell>
            <TableCell className="py-4 bg-gray-50/30">
              <Badge variant="outline" className="text-xs">
                {item.category_name || 'N/A'}
              </Badge>
            </TableCell>
            <TableCell className={`${TABLE_STYLES.actionCell} bg-gray-50/30`}>
              <div className="flex items-center gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit('subcategory', item.category_key)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {canEdit && (
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </>
        );

      case 'measurements':
        return (
          <>
            <TableCell className={`${TABLE_STYLES.rowNumber} bg-emerald-50/50`}>
              {globalIndex}
            </TableCell>
            <TableCell className="font-medium py-4 bg-white">{item.measurement}</TableCell>
            <TableCell className="text-center py-4 bg-gray-50/30">
              <Badge variant="outline" className="text-xs">
                {item.unit || '-'}
              </Badge>
            </TableCell>
            <TableCell className="py-4 bg-white">
              <Badge variant="outline" className="text-xs">
                {item.category_name || 'N/A'}
              </Badge>
            </TableCell>
            <TableCell className="py-4 bg-gray-50/30">
              <Badge variant="outline" className="text-xs">
                {item.subcategory_name || 'N/A'}
              </Badge>
            </TableCell>
            <TableCell className={`${TABLE_STYLES.actionCell} bg-white`}>
              <div className="flex items-center gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit('measurement', item.category_key, item.subcategory_key)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {canEdit && (
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
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

  const getRowNumberBg = () => {
    switch (theme) {
      case 'blue':
        return 'bg-blue-50/50';
      case 'purple':
        return 'bg-purple-50/50';
      case 'emerald':
        return 'bg-emerald-50/50';
      default:
        return 'bg-gray-50/50';
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
    return <TableContainer icon={Icon} title={title} theme={theme} loading />;
  }

  if (total === 0) {
    return (
      <TableContainer
        icon={Icon}
        title={title}
        theme={theme}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
        searchActions={
          canEdit && (
            <Button size="sm" className="h-9" onClick={() => onAdd(activeTab as any)}>
              <Plus className="h-4 w-4 mr-1" />
              Add {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
            </Button>
          )
        }
        empty
        emptyTitle={`No ${title.toLowerCase()} found`}
        emptyDescription={searchTerm ? 'Try adjusting your search terms.' : 'No data available.'}
      />
    );
  }

  return (
    <TableContainer
      icon={Icon}
      title={title}
      badge={`${total} items`}
      totalCount={total}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder={`Search ${title.toLowerCase()}...`}
      searchActions={
        canEdit && (
          <Button size="sm" className="h-9" onClick={() => onAdd(activeTab as any)}>
            <Plus className="h-4 w-4 mr-1" />
            Add {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
          </Button>
        )
      }
      theme={theme}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className={`${getHeaderGradient()} sticky top-0 z-10`}>
            <TableRow className={TABLE_STYLES.headerRow}>
              <TableHead className={`w-12 ${getHeaderCellBg()} ${TABLE_STYLES.headerCell} pl-6`}>
                #
              </TableHead>
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className={`${getHeaderCellBg()} ${TABLE_STYLES.headerCell} ${
                    col === 'Actions' ? 'w-24 pr-6' : ''
                  } ${col === 'Unit' ? 'text-center' : ''}`}>
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => (
              <TableRow key={item.id || idx} className={`${TABLE_STYLES.dataRow} ${getRowHover()}`}>
                {renderRow(item, idx)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
