import React from 'react';
import AdminListItem, { AdminListItemProps } from './AdminListItem';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trash2, Eye, EyeOff, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';

export interface AdminListProps {
  items: Omit<AdminListItemProps, 'index'>[];
  theme?: 'blue' | 'orange' | 'purple' | 'green';
  itemType?: 'application' | 'category' | 'banner' | 'trip';
  actions?: {
    edit?: boolean;
    delete?: boolean;
    statusToggle?: boolean;
    open?: boolean;
    approve?: boolean;
    reject?: boolean;
  };
  emptyState?: React.ReactNode;
  viewMode?: 'grid' | 'list';
  // Selection support
  selectedIds?: (string | number)[];
  onSelect?: (ids: (string | number)[]) => void;
  onBulkDelete?: (ids: (string | number)[]) => void;
  onBulkActivate?: (ids: (string | number)[]) => void;
  onBulkDeactivate?: (ids: (string | number)[]) => void;
  onBulkApprove?: (ids: (string | number)[]) => void;
  onBulkReject?: (ids: (string | number)[]) => void;
}

const AdminList: React.FC<AdminListProps> = ({
  items,
  theme = 'blue',
  itemType = 'application',
  actions = {
    edit: true,
    delete: true,
    statusToggle: true,
    open: true,
  },
  emptyState,
  viewMode = 'grid',
  selectedIds = [],
  onSelect,
  onBulkDelete,
  onBulkActivate,
  onBulkDeactivate,
  onBulkApprove,
  onBulkReject,
}) => {
  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  // Selection handlers
  const allSelected = selectedIds.length === items.length && items.length > 0;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelect?.([]);
    } else {
      onSelect?.(items.map((item) => item.id));
    }
  };

  const handleSelectOne = (id: string | number) => {
    if (selectedIds.includes(id)) {
      onSelect?.(selectedIds.filter((i) => i !== id));
    } else {
      onSelect?.([...selectedIds, id]);
    }
  };

  // Check if bulk actions are available
  const hasBulkActions =
    onBulkDelete || onBulkActivate || onBulkDeactivate || onBulkApprove || onBulkReject;

  return (
    <>
      {/* Select All Header - Only show if selection is enabled */}
      {onSelect && hasBulkActions && (
        <div
          className={`flex items-center justify-between mb-3 p-3 rounded-lg border transition-colors ${
            selectedIds.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
          }`}>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full cursor-pointer transition-all duration-200 ${
                selectedIds.length > 0
                  ? 'bg-red-500 shadow-md shadow-red-500/20'
                  : 'bg-white/95 hover:bg-gray-50 shadow-sm hover:shadow border border-gray-200/50'
              }`}
              onClick={handleSelectAll}>
              {allSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
            </div>
            <span
              className={`text-sm font-medium ${
                selectedIds.length > 0 ? 'text-red-700' : 'text-gray-700'
              }`}>
              {selectedIds.length > 0
                ? `${selectedIds.length} selected`
                : `Select all (${items.length} items)`}
            </span>
          </div>

          {/* Bulk Actions Menu */}
          {selectedIds.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 bg-white border-blue-300 text-blue-700 hover:bg-blue-50">
                  <MoreHorizontal className="w-4 h-4 mr-1" />
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Application status actions */}
                {itemType === 'application' && onBulkApprove && (
                  <DropdownMenuItem onClick={() => onBulkApprove(selectedIds)}>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Approve All
                  </DropdownMenuItem>
                )}
                {itemType === 'application' && onBulkReject && (
                  <DropdownMenuItem onClick={() => onBulkReject(selectedIds)}>
                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                    Reject All
                  </DropdownMenuItem>
                )}
                {itemType === 'application' && (onBulkApprove || onBulkReject) && onBulkDelete && (
                  <DropdownMenuSeparator />
                )}

                {/* Banner/Trip status actions */}
                {itemType !== 'application' && onBulkActivate && (
                  <DropdownMenuItem onClick={() => onBulkActivate(selectedIds)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Activate All
                  </DropdownMenuItem>
                )}
                {itemType !== 'application' && onBulkDeactivate && (
                  <DropdownMenuItem onClick={() => onBulkDeactivate(selectedIds)}>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Deactivate All
                  </DropdownMenuItem>
                )}
                {itemType !== 'application' &&
                  (onBulkActivate || onBulkDeactivate) &&
                  onBulkDelete && <DropdownMenuSeparator />}

                {onBulkDelete && (
                  <DropdownMenuItem
                    onClick={() => onBulkDelete(selectedIds)}
                    className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Items Grid/List */}
      <div
        className={`grid gap-4 sm:gap-6 ${
          viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        }`}>
        {items.map((item, index) => (
          <AdminListItem
            key={item.id}
            {...item}
            index={index}
            theme={theme}
            itemType={itemType}
            actions={actions}
            selected={selectedIds.includes(item.id)}
            onSelect={onSelect ? () => handleSelectOne(item.id) : undefined}
          />
        ))}
      </div>
    </>
  );
};

export default AdminList;
