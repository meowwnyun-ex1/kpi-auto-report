import React from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/Image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle,
  Edit,
  Eye,
  EyeOff,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Folder,
  TrendingUp,
  Target,
  LinkIcon,
  Package,
  ImageIcon,
  MapPin,
  Clock,
  Zap,
  XCircle,
} from 'lucide-react';

export interface AdminListItemProps {
  id: string | number;
  title: string;
  description?: string | null;
  icon?: string | null;
  imageThumbnail?: string | null;
  imageUrl?: string | null;
  status?: string | null;
  isActive?: boolean;
  category?: string | null;
  viewCount?: number;
  sortOrder?: number;
  linkUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  url?: string;
  onEdit?: (item: any) => void;
  onDelete?: (id: string | number, title: string) => void;
  onStatusToggle?: (item: any) => void;
  onApprove?: (id: string | number) => void;
  onReject?: (id: string | number) => void;
  index: number;
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
  // Selection support
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

const AdminListItem: React.FC<AdminListItemProps> = ({
  id,
  title,
  description: _description,
  icon,
  imageThumbnail,
  imageUrl,
  status,
  isActive = true,
  category,
  viewCount,
  sortOrder,
  linkUrl,
  startDate: _startDate,
  endDate: _endDate,
  url,
  onEdit,
  onDelete,
  onStatusToggle,
  onApprove,
  onReject,
  index,
  theme = 'blue',
  itemType = 'application',
  actions = {
    edit: true,
    delete: true,
    statusToggle: true,
    open: true,
    approve: true,
    reject: true,
  },
  selected = false,
  onSelect,
}) => {
  // Enhanced theme configurations with modern gradients
  const themeConfig = {
    blue: {
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      lightGradient: 'from-blue-50 via-indigo-50 to-purple-50',
      border: 'border-blue-200',
      shadow: 'shadow-blue-500/20',
      iconBg: 'from-blue-100 via-indigo-100 to-purple-100',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      glowColor: 'group-hover:shadow-blue-500/30',
    },
    orange: {
      gradient: 'from-orange-500 via-amber-500 to-yellow-500',
      lightGradient: 'from-orange-50 via-amber-50 to-yellow-50',
      border: 'border-orange-200',
      shadow: 'shadow-orange-500/20',
      iconBg: 'from-orange-100 via-amber-100 to-yellow-100',
      iconColor: 'text-orange-600',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
      glowColor: 'group-hover:shadow-orange-500/30',
    },
    purple: {
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      lightGradient: 'from-purple-50 via-pink-50 to-rose-50',
      border: 'border-purple-200',
      shadow: 'shadow-purple-500/20',
      iconBg: 'from-purple-100 via-pink-100 to-rose-100',
      iconColor: 'text-purple-600',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      glowColor: 'group-hover:shadow-purple-500/30',
    },
    green: {
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      lightGradient: 'from-green-50 via-emerald-50 to-teal-50',
      border: 'border-green-200',
      shadow: 'shadow-green-500/20',
      iconBg: 'from-green-100 via-emerald-100 to-teal-100',
      iconColor: 'text-green-600',
      badgeBg: 'bg-green-100 text-green-800 border-green-200',
      glowColor: 'group-hover:shadow-green-500/30',
    },
  };

  const config = themeConfig[theme];

  // Get status badge - compact and modern
  const getStatusBadge = () => {
    if (itemType === 'application' && status) {
      const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
        pending: {
          bg: 'bg-amber-100 text-amber-700 border-amber-200',
          text: 'Pending',
          icon: <Clock className="w-3 h-3" />,
        },
        approved: {
          bg: 'bg-green-100 text-green-700 border-green-200',
          text: 'Approved',
          icon: <CheckCircle className="w-3 h-3" />,
        },
        rejected: {
          bg: 'bg-red-100 text-red-700 border-red-200',
          text: 'Rejected',
          icon: <Trash2 className="w-3 h-3" />,
        },
      };
      const config = statusConfig[status];
      if (config) {
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}>
            {config.icon}
            {config.text}
          </span>
        );
      }
    }
    // Active/Inactive for non-application items
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
          isActive
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-gray-100 text-gray-600 border-gray-200'
        }`}>
        {isActive ? <Zap className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  // Remove duplicate getActiveStatusBadge - merged into getStatusBadge

  // Get icon - simplified without duplicate status indicator
  const getIcon = () => {
    const iconProps = {
      application: Package,
      category: icon || '📁',
      banner: ImageIcon,
      trip: MapPin,
    };

    const IconComponent = iconProps[itemType];

    if (imageThumbnail || imageUrl) {
      return (
        <Image
          src={imageThumbnail || imageUrl}
          alt={title}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shadow-md ring-2 ring-white"
          fallbackType="error"
          lazy={false}
        />
      );
    }

    if (itemType === 'category' && icon) {
      if (icon.startsWith('data:image')) {
        return (
          <Image
            src={icon}
            alt={title}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shadow-md ring-2 ring-white"
            fallbackType="error"
            lazy={false}
          />
        );
      }
      return (
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-2xl shadow-md ring-2 ring-white border border-orange-200">
          {icon}
        </div>
      );
    }

    return (
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${config.iconBg} flex items-center justify-center shadow-md ring-2 ring-white`}>
        <IconComponent className={`w-7 h-7 ${config.iconColor}`} />
      </div>
    );
  };

  // Get metadata pills - compact style
  const getMetadataPills = () => {
    const pills = [];

    if (category && itemType === 'application') {
      pills.push({
        icon: Folder,
        text: category,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      });
    }

    if (viewCount && itemType === 'application') {
      pills.push({
        icon: TrendingUp,
        text: `${viewCount.toLocaleString()} views`,
        className: 'bg-green-50 text-green-700 border-green-200',
      });
    }

    if (sortOrder !== undefined && (itemType === 'banner' || itemType === 'trip')) {
      pills.push({
        icon: Target,
        text: `#${sortOrder}`,
        className:
          itemType === 'banner'
            ? 'bg-purple-50 text-purple-700 border-purple-200'
            : 'bg-green-50 text-green-700 border-green-200',
      });
    }

    if (linkUrl && itemType === 'banner') {
      pills.push({
        icon: LinkIcon,
        text: linkUrl.length > 20 ? `${linkUrl.substring(0, 20)}...` : linkUrl,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      });
    }

    return pills;
  };

  const metadataPills = getMetadataPills();

  // Remove duplicate status indicator - already shown in badge

  return (
    <div
      className={`group relative bg-white rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg ${
        selected
          ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/30'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}>
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${config.gradient}`} />

      {/* Selection Checkbox - Only show if onSelect is provided */}
      {onSelect && (
        <div
          className={`absolute top-2 left-2 z-10 flex items-center justify-center w-6 h-6 rounded-full cursor-pointer transition-all duration-200 ${
            selected
              ? 'bg-red-500 scale-110 shadow-md shadow-red-500/30'
              : 'bg-white/95 hover:bg-gray-50 shadow-sm hover:shadow border border-gray-200/50'
          }`}
          onClick={() => onSelect(!selected)}>
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
        </div>
      )}

      <div className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header - Icon and Title */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">{getIcon()}</div>

            {/* Title and Status */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-1.5">
                <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {title}
                </h4>
                <div className="flex flex-wrap items-center gap-1.5">{getStatusBadge()}</div>
              </div>
            </div>
          </div>

          {/* Metadata Pills */}
          {metadataPills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {metadataPills.slice(0, 3).map((pill, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${pill.className}`}>
                  <pill.icon className="w-3 h-3" />
                  <span className="truncate max-w-[100px]" title={pill.text}>
                    {pill.text}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {actions.open && url && (
                <Button variant="outline" size="sm" asChild className="h-7 px-2.5 text-xs">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </a>
                </Button>
              )}
            </div>

            {(actions.edit || actions.delete || actions.statusToggle) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-40">
                  {/* Edit - Always on top */}
                  {actions.edit && onEdit && (
                    <DropdownMenuItem onClick={() => onEdit({ id, title, ...({} as any) })}>
                      <Edit className="w-3.5 h-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}

                  {/* Separator after Edit if there are more actions */}
                  {actions.edit &&
                    (actions.approve ||
                      actions.reject ||
                      actions.statusToggle ||
                      actions.delete) && <DropdownMenuSeparator />}

                  {/* Application status actions */}
                  {itemType === 'application' && actions.approve && onApprove && (
                    <DropdownMenuItem onClick={() => onApprove(id)} className="text-green-600">
                      <CheckCircle className="w-3.5 h-3.5 mr-2" />
                      Approve
                    </DropdownMenuItem>
                  )}
                  {itemType === 'application' && actions.reject && onReject && (
                    <DropdownMenuItem onClick={() => onReject(id)} className="text-red-600">
                      <XCircle className="w-3.5 h-3.5 mr-2" />
                      Reject
                    </DropdownMenuItem>
                  )}

                  {/* Separator after approve/reject if there's delete */}
                  {itemType === 'application' &&
                    (actions.approve || actions.reject) &&
                    actions.delete && <DropdownMenuSeparator />}

                  {/* Active/Inactive toggle for non-application items */}
                  {itemType !== 'application' && actions.statusToggle && onStatusToggle && (
                    <DropdownMenuItem onClick={() => onStatusToggle({ id, title, ...({} as any) })}>
                      {isActive ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                  )}

                  {/* Separator after status toggle if there's delete */}
                  {itemType !== 'application' && actions.statusToggle && actions.delete && (
                    <DropdownMenuSeparator />
                  )}

                  {/* Delete - Always at bottom */}
                  {actions.delete && onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(id, title)} className="text-red-600">
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminListItem;
