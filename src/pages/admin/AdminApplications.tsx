import React, { useMemo, useState } from 'react';
import AdminList from '@/components/admin/AdminList';
import { Application } from '@/shared/types';
import { Package, Plus, Search, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FullPagination } from '@/components/ui/pagination';
import { useAdminNavigation } from '@/hooks';

interface AdminApplicationsProps {
  applications: Application[];
  onRefresh: () => void;
  onStatusFilterChange: (filter: string) => void;
  onSearchChange: (query: string) => void;
  onStatusChange: (appId: number, status: string) => void;
  onDelete: (appId: number, appName: string) => void;
  onApprove: (appId: number) => void;
  onReject: (appId: number) => void;
  showAddButton?: boolean;
  onAdd?: () => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

const AdminApplications: React.FC<AdminApplicationsProps> = ({
  applications,
  onRefresh,
  onStatusFilterChange,
  onSearchChange,
  onStatusChange,
  onDelete,
  onApprove,
  onReject,
  showAddButton = false,
  onAdd,
  currentPage: externalCurrentPage,
  onPageChange: externalOnPageChange,
}) => {
  const { navigateToForm } = useAdminNavigation();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [statusFilterState, setStatusFilterState] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 12; // Increased for grid view
  // Selection state
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  // Use external page state if provided, otherwise use internal state
  const currentPage = externalCurrentPage ?? internalCurrentPage;
  const setCurrentPage = externalOnPageChange ?? setInternalCurrentPage;

  // Filter applications based on search query and status
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Filter by search query
    if (localSearchQuery) {
      filtered = filtered.filter(
        (app) =>
          app.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
          app.category_name?.toLowerCase().includes(localSearchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilterState !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilterState);
    }

    return filtered;
  }, [applications, localSearchQuery, statusFilterState]);

  // Pagination logic
  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredApplications.slice(startIndex, endIndex);
  }, [filteredApplications, currentPage]);

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when search or filter changes
  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query);
    setCurrentPage(1);
    onSearchChange(query);
  };

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilterState(filter);
    setCurrentPage(1);
    onStatusFilterChange(filter);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  // Handle bulk delete
  const handleBulkDelete = (ids: (string | number)[]) => {
    // Use parent's onDelete if available
    if (onDelete) {
      ids.forEach((id) => {
        const app = applications.find((a) => a.id === id);
        onDelete(id as number, app?.name || 'Unknown');
      });
      setSelectedIds([]);
    }
  };

  // Handle bulk approve
  const handleBulkApprove = (ids: (string | number)[]) => {
    // Use parent's onApprove if available
    if (onApprove) {
      ids.forEach((id) => onApprove(id as number));
      setSelectedIds([]);
    }
  };

  // Handle bulk reject
  const handleBulkReject = (ids: (string | number)[]) => {
    // Use parent's onReject if available
    if (onReject) {
      ids.forEach((id) => onReject(id as number));
      setSelectedIds([]);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      {/* Header - Fixed */}
      <div className="flex flex-shrink-0 gap-4 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <span className="text-sm text-gray-500">
              {filteredApplications.length} applications
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {showAddButton && (
            <Button size="sm" onClick={() => onAdd?.() || navigateToForm('applications')}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>
      </div>

      {/* Filters - Fixed */}
      <div className="flex flex-shrink-0 items-center justify-end gap-3">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search applications..."
            className="h-9 pl-9 bg-white"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilterState} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="h-9 w-36 bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
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

      {/* Applications Grid/List - Scrollable */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-2">
          <AdminList
            items={paginatedApplications.map((app) => ({
              id: app.id,
              title: app.name,
              imageThumbnail: app.image_thumbnail,
              imageUrl: app.image_small || app.image_path,
              status: app.status,
              category: app.category_name,
              viewCount: app.view_count,
              url: app.url,
              onEdit: () =>
                navigateToForm(`/admin/applications/edit/${app.id}`, '/admin/applications'),
              onDelete: () => onDelete(app.id, app.name),
              onStatusToggle: () => onStatusChange(app.id, 'toggle'),
              onApprove: () => onApprove(app.id),
              onReject: () => onReject(app.id),
            }))}
            theme="blue"
            itemType="application"
            viewMode={viewMode}
            actions={{
              edit: true,
              delete: true,
              statusToggle: true,
              open: true,
              approve: true,
              reject: true,
            }}
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
            onBulkDelete={handleBulkDelete}
            onBulkApprove={handleBulkApprove}
            onBulkReject={handleBulkReject}
            emptyState={
              <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
                <img src="/found.png" alt="Not found" className="w-32 h-32 mb-4 object-contain" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Applications Found</h3>
                <p className="text-gray-500 text-center max-w-md">
                  {localSearchQuery
                    ? `No applications match "${localSearchQuery}". Try a different search term.`
                    : 'There are no applications to display. Add your first application to get started.'}
                </p>
              </div>
            }
          />
        </div>
      </div>

      {/* Pagination - Fixed at bottom */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 pt-2 border-t bg-white/50 backdrop-blur-sm -mx-2 px-2">
          <FullPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredApplications.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
export { AdminApplications };
