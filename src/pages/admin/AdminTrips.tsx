import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Trip } from '@/shared/types';
import { getApiUrl } from '@/config/api';
import { handleSessionValidation, handleAuthError } from '@/shared/utils/session-manager';
import AdminList from '@/components/admin/AdminList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { UnifiedError } from '@/components/ui/unified-error';
import { storage } from '@/shared/utils';
import { useToast } from '@/hooks/use-toast';
import { useConfirmDialog } from '@/components/ui';
import { Search, RefreshCw, Plus, Calendar, LayoutGrid, List } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FullPagination } from '@/components/ui/pagination';
import { TOAST_MESSAGES, DIALOG_TEXTS, STATUS_TOGGLE_MESSAGES } from '@/shared/constants';

interface AdminTripsProps {
  trips?: any[];
  onEdit?: (trip: any) => void;
  onAdd?: () => void;
  onDelete?: (id: number) => void;
  onPageChange?: (page: number) => void;
  onLoadMore?: () => void;
  hasMoreTrips?: boolean;
  isLoadingMore?: boolean;
}

const AdminTrips: React.FC<AdminTripsProps> = ({ trips: initialTrips = [], onEdit, onAdd }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const { showDialog, ConfirmDialogComponent } = useConfirmDialog();
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [loading, setLoading] = useState(!initialTrips.length);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_actionLoading, setActionLoading] = useState<number | null>(null);
  const [sortBy] = useState<'title' | 'created' | 'sortOrder'>('sortOrder');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 12; // Increased for grid view
  // Selection state
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  // Enhanced filtering and sorting
  const filteredTrips = useMemo(() => {
    let filtered = trips.filter((trip) =>
      trip.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter((trip) => trip.is_active);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter((trip) => !trip.is_active);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'sortOrder':
        default:
          return a.sort_order - b.sort_order;
      }
    });

    return filtered;
  }, [trips, searchTerm, filterStatus, sortBy]);

  // Pagination logic
  const paginatedTrips = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTrips.slice(startIndex, endIndex);
  }, [filteredTrips, currentPage]);

  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when search or filter changes
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleFilterStatusChange = (status: 'all' | 'active' | 'inactive') => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  // Fetch trips
  const fetchTrips = async () => {
    if (!handleSessionValidation(logout, navigate, toast)) {
      return;
    }

    try {
      setError(null);
      const token = storage.getAuthToken();
      const response = await fetch(`${getApiUrl()}/trips`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        handleAuthError(response, logout, navigate, toast);
        return;
      }

      const data = await response.json();
      setTrips(data.data || data.trips || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError('Failed to fetch trips. Please check your connection and try again.');
      toast({ title: TOAST_MESSAGES.FAILED_FETCH_TRIPS, variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!initialTrips.length) {
      fetchTrips();
    }
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
  };

  // Handle status toggle
  const handleStatusToggle = (trip: Trip) => {
    showDialog({
      title: trip.is_active ? 'Deactivate Trip' : 'Activate Trip',
      description: trip.is_active
        ? `Are you sure you want to deactivate "${trip.title}"? It will no longer be visible on the main page.`
        : `Are you sure you want to activate "${trip.title}"? It will be visible on the main page.`,
      confirmText: DIALOG_TEXTS.CONFIRM,
      cancelText: DIALOG_TEXTS.CANCEL,
      variant: trip.is_active ? 'danger' : undefined,
      onConfirm: async () => {
        if (!handleSessionValidation(logout, navigate, toast)) {
          return;
        }

        setActionLoading(trip.id);
        try {
          const token = storage.getAuthToken();
          const formData = new FormData();
          formData.append('title', trip.title);
          formData.append('is_active', (!trip.is_active).toString());
          formData.append('sort_order', trip.sort_order.toString());
          if (trip.image_thumbnail) {
            formData.append('keep_existing_image', 'true');
          }

          const response = await fetch(`${getApiUrl()}/trips/${trip.id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (response.ok) {
            await fetchTrips();
            toast({
              title: trip.is_active
                ? STATUS_TOGGLE_MESSAGES.TRIP_DEACTIVATED
                : STATUS_TOGGLE_MESSAGES.TRIP_ACTIVATED,
              variant: 'success',
            });
          } else {
            handleAuthError(response, logout, navigate, toast);
          }
        } catch (error) {
          console.error('Error updating trip status:', error);
          toast({ title: TOAST_MESSAGES.FAILED_SAVE_TRIP, variant: 'destructive' });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Handle delete
  const handleDelete = (id: number, title: string) => {
    showDialog({
      title: DIALOG_TEXTS.DELETE_TRIP_TITLE,
      description: DIALOG_TEXTS.DELETE_TRIP_DESC(title),
      confirmText: DIALOG_TEXTS.CONFIRM,
      cancelText: DIALOG_TEXTS.CANCEL,
      variant: 'danger',
      onConfirm: async () => {
        if (!handleSessionValidation(logout, navigate, toast)) {
          return;
        }

        setActionLoading(id);
        try {
          const token = storage.getAuthToken();
          const response = await fetch(`${getApiUrl()}/trips/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            await fetchTrips();
            toast({ title: TOAST_MESSAGES.TRIP_DELETED, variant: 'success' });
          } else {
            handleAuthError(response, logout, navigate, toast);
          }
        } catch (error) {
          console.error('Error deleting trip:', error);
          toast({ title: TOAST_MESSAGES.FAILED_DELETE_TRIP, variant: 'destructive' });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Handle add button click
  const handleAddClick = () => {
    if (onAdd) {
      onAdd();
    } else {
      navigate('/admin/trips/Form');
    }
  };

  // Handle edit
  const handleEdit = (trip: Trip) => {
    if (onEdit) {
      onEdit(trip);
    } else {
      navigate(`/admin/trips/edit/${trip.id}`);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = (ids: (string | number)[]) => {
    showDialog({
      title: 'Delete Selected Trips',
      description: `Are you sure you want to delete ${ids.length} selected trips? This action cannot be undone.`,
      confirmText: DIALOG_TEXTS.CONFIRM,
      cancelText: DIALOG_TEXTS.CANCEL,
      variant: 'danger',
      onConfirm: async () => {
        if (!handleSessionValidation(logout, navigate, toast)) {
          return;
        }

        try {
          const token = storage.getAuthToken();
          let successCount = 0;
          let failCount = 0;

          for (const id of ids) {
            const response = await fetch(`${getApiUrl()}/trips/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
              successCount++;
            } else {
              failCount++;
            }
          }

          await fetchTrips();
          setSelectedIds([]);

          if (successCount > 0) {
            toast({
              title: `Successfully deleted ${successCount} trip(s)`,
              variant: 'success',
            });
          }
          if (failCount > 0) {
            toast({
              title: `Failed to delete ${failCount} trip(s)`,
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error bulk deleting trips:', error);
          toast({ title: TOAST_MESSAGES.FAILED_DELETE_TRIP, variant: 'destructive' });
        }
      },
    });
  };

  // Handle bulk activate
  const handleBulkActivate = async (ids: (string | number)[]) => {
    if (!handleSessionValidation(logout, navigate, toast)) {
      return;
    }

    try {
      const token = storage.getAuthToken();
      let successCount = 0;

      for (const id of ids) {
        const trip = trips.find((t) => t.id === id);
        if (trip && !trip.is_active) {
          const formData = new FormData();
          formData.append('title', trip.title);
          formData.append('is_active', 'true');
          formData.append('sort_order', trip.sort_order.toString());
          if (trip.image_thumbnail) {
            formData.append('keep_existing_image', 'true');
          }

          const response = await fetch(`${getApiUrl()}/trips/${id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (response.ok) {
            successCount++;
          }
        }
      }

      await fetchTrips();
      setSelectedIds([]);

      if (successCount > 0) {
        toast({
          title: `Successfully activated ${successCount} trip(s)`,
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Error bulk activating trips:', error);
      toast({ title: TOAST_MESSAGES.FAILED_SAVE_TRIP, variant: 'destructive' });
    }
  };

  // Handle bulk deactivate
  const handleBulkDeactivate = async (ids: (string | number)[]) => {
    if (!handleSessionValidation(logout, navigate, toast)) {
      return;
    }

    try {
      const token = storage.getAuthToken();
      let successCount = 0;

      for (const id of ids) {
        const trip = trips.find((t) => t.id === id);
        if (trip && trip.is_active) {
          const formData = new FormData();
          formData.append('title', trip.title);
          formData.append('is_active', 'false');
          formData.append('sort_order', trip.sort_order.toString());
          if (trip.image_thumbnail) {
            formData.append('keep_existing_image', 'true');
          }

          const response = await fetch(`${getApiUrl()}/trips/${id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (response.ok) {
            successCount++;
          }
        }
      }

      await fetchTrips();
      setSelectedIds([]);

      if (successCount > 0) {
        toast({
          title: `Successfully deactivated ${successCount} trip(s)`,
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Error bulk deactivating trips:', error);
      toast({ title: TOAST_MESSAGES.FAILED_SAVE_TRIP, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full min-h-0 gap-4">
        {/* Header - Fixed */}
        <div className="flex flex-shrink-0 gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
              <span className="text-sm text-gray-500">{filteredTrips.length} trips</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={handleAddClick}>
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
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search..."
              className="h-9 pl-9 bg-white"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filterStatus}
            onValueChange={(val) => handleFilterStatusChange(val as any)}>
            <SelectTrigger className="h-9 w-32 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
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

        {/* Error Display */}
        {error && (
          <Card className="p-6">
            <CardContent className="max-w-sm mx-auto text-center">
              <UnifiedError
                type="network"
                message="Failed to load trips"
                showRetry={true}
                onRetry={fetchTrips}
                compact={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Trips Grid/List - Scrollable */}
        {!error && (
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="p-2">
              {filteredTrips.length === 0 ? (
                <Card className="p-6">
                  <CardContent className="max-w-sm mx-auto text-center">
                    <img
                      src="/found.png"
                      alt="Not found"
                      className="w-32 h-32 mx-auto mb-4 object-contain"
                    />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trips Found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm
                        ? `No trips match "${searchTerm}"`
                        : 'There are no trips to display'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={handleAddClick} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Trip
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <AdminList
                  items={paginatedTrips.map((trip) => ({
                    id: trip.id,
                    title: trip.title,
                    imageThumbnail: trip.image_thumbnail || undefined,
                    isActive: trip.is_active,
                    sortOrder: trip.sort_order,
                    onEdit: () => handleEdit(trip),
                    onDelete: () => handleDelete(trip.id, trip.title),
                    onStatusToggle: () => handleStatusToggle(trip),
                  }))}
                  theme="green"
                  itemType="trip"
                  viewMode={viewMode}
                  actions={{
                    edit: true,
                    delete: true,
                    statusToggle: true,
                    open: false,
                  }}
                  selectedIds={selectedIds}
                  onSelect={setSelectedIds}
                  onBulkDelete={handleBulkDelete}
                  onBulkActivate={handleBulkActivate}
                  onBulkDeactivate={handleBulkDeactivate}
                />
              )}
            </div>
          </div>
        )}

        {/* Pagination - Fixed at bottom */}
        {!error && totalPages > 1 && (
          <div className="flex-shrink-0 pt-2 border-t bg-white/50 backdrop-blur-sm -mx-2 px-2">
            <FullPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={filteredTrips.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>

      <ConfirmDialogComponent />
    </>
  );
};

export default AdminTrips;
