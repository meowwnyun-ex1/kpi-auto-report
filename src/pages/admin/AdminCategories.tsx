import React, { useState, useMemo } from 'react';
import { Folder, Plus, Search, LayoutGrid, List, RefreshCw } from 'lucide-react';
import AdminList from '@/components/admin/AdminList';
import { Category } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { FullPagination } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';

interface AdminCategoriesProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onAdd: () => void;
  onDelete: (id: number) => Promise<void>;
  onStatusToggle?: (category: Category) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onBulkDelete?: (ids: (string | number)[]) => Promise<void>;
  onBulkActivate?: (ids: (string | number)[]) => Promise<void>;
  onBulkDeactivate?: (ids: (string | number)[]) => Promise<void>;
}

const AdminCategories: React.FC<AdminCategoriesProps> = ({
  categories,
  onEdit,
  onAdd,
  onDelete,
  onStatusToggle,
  onRefresh,
  isRefreshing = false,
  currentPage: externalCurrentPage,
  onPageChange: externalOnPageChange,
  onBulkDelete,
  onBulkActivate,
  onBulkDeactivate,
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const itemsPerPage = 12; // Increased for grid view

  // Use external page state if provided, otherwise use internal state
  const currentPage = externalCurrentPage ?? internalCurrentPage;
  const setCurrentPage = externalOnPageChange ?? setInternalCurrentPage;

  const filteredCategories = useMemo(() => {
    let filtered = categories;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter((cat) => cat.is_active !== false);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((cat) => cat.is_active === false);
    }

    return filtered;
  }, [categories, searchQuery, statusFilter]);

  // Pagination logic
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCategories.slice(startIndex, endIndex);
  }, [filteredCategories, currentPage]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when search or filter changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  // Bulk action handlers
  const handleBulkDelete = async (ids: (string | number)[]) => {
    if (!onBulkDelete) return;
    try {
      await onBulkDelete(ids);
      setSelectedIds([]);
      toast({ title: `Deleted ${ids.length} categories`, variant: 'default' });
    } catch (error) {
      toast({ title: 'Failed to delete categories', variant: 'destructive' });
    }
  };

  const handleBulkActivate = async (ids: (string | number)[]) => {
    if (!onBulkActivate) return;
    try {
      await onBulkActivate(ids);
      setSelectedIds([]);
      toast({ title: `Activated ${ids.length} categories`, variant: 'default' });
    } catch (error) {
      toast({ title: 'Failed to activate categories', variant: 'destructive' });
    }
  };

  const handleBulkDeactivate = async (ids: (string | number)[]) => {
    if (!onBulkDeactivate) return;
    try {
      await onBulkDeactivate(ids);
      setSelectedIds([]);
      toast({ title: `Deactivated ${ids.length} categories`, variant: 'default' });
    } catch (error) {
      toast({ title: 'Failed to deactivate categories', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      {/* Header - Fixed */}
      <div className="flex flex-shrink-0 gap-4 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Folder className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <span className="text-sm text-gray-500">{filteredCategories.length} categories</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Filters - Fixed */}
      <div className="flex flex-shrink-0 items-center justify-end gap-3">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search..."
            className="h-9 pl-9 bg-white"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(val) => handleStatusFilterChange(val)}>
          <SelectTrigger className="h-9 w-32 bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-7 px-2">
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-7 px-2">
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Categories Grid/List - Scrollable */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-2">
          {filteredCategories.length === 0 ? (
            <Card className="p-6">
              <CardContent className="max-w-sm mx-auto text-center">
                <img
                  src="/found.png"
                  alt="Not found"
                  className="w-32 h-32 mx-auto mb-4 object-contain"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Categories Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? `No categories match "${searchQuery}"`
                    : 'There are no categories to display'}
                </p>
                {!searchQuery && (
                  <Button onClick={onAdd} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <AdminList
              items={paginatedCategories.map((category) => ({
                id: category.id,
                title: category.name,
                icon: category.icon,
                isActive: category.is_active !== false,
                onEdit: () => onEdit(category),
                onDelete: () => onDelete(category.id),
                onStatusToggle: onStatusToggle ? () => onStatusToggle(category) : undefined,
              }))}
              theme="orange"
              itemType="category"
              viewMode={viewMode}
              actions={{
                edit: true,
                delete: true,
                statusToggle: !!onStatusToggle,
                open: false,
              }}
              selectedIds={selectedIds}
              onSelect={setSelectedIds}
              onBulkDelete={onBulkDelete ? handleBulkDelete : undefined}
              onBulkActivate={onBulkActivate ? handleBulkActivate : undefined}
              onBulkDeactivate={onBulkDeactivate ? handleBulkDeactivate : undefined}
            />
          )}
        </div>
      </div>

      {/* Pagination - Fixed at bottom */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 pt-2 border-t bg-white/50 backdrop-blur-sm -mx-2 px-2">
          <FullPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCategories.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
