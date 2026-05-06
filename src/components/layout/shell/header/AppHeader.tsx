import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { StatsWidget } from '@/shared/components';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/shared/utils/storage';
import type { LayoutVariant } from '@/components/layout/shell/shell-types';

export interface AppHeaderProps {
  variant: LayoutVariant;
  breadcrumbExtra?: string;
  showNavToggle: boolean;
  showStats: boolean;
  headerContent?: React.ReactNode;
}

function breadcrumbVariantFor(v: LayoutVariant): 'admin' | 'user' {
  return v === 'admin' ? 'admin' : 'user';
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  variant,
  breadcrumbExtra,
  showNavToggle,
  showStats,
  headerContent,
}) => {
  const { user } = useAuth();
  const isMinimal = variant === 'minimal';
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/approval/notifications', {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data || []);
        setUnreadCount(data?.filter((n: any) => !n.is_read).length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/approval/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (isMinimal) {
    return (
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700">
          KPI Management Tool
        </Link>
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
          Back to dashboard
        </Link>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-4">
        {showNavToggle && (
          <SidebarTrigger
            aria-label="Toggle sidebar"
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:shadow-md">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
        )}

        <Breadcrumb
          variant={breadcrumbVariantFor(variant)}
          showIcons
          showBadges={false}
          compact
          extra={breadcrumbExtra}
        />
      </div>

      <div className="flex items-center gap-3">
        {showStats && <StatsWidget />}

        {/* Notification Bell */}
        {user && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 relative"
              onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No notifications</div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}>
                      <div className="text-sm font-medium">{notification.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{notification.message}</div>
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {headerContent}
      </div>
    </header>
  );
};
