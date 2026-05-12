import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { StatsWidget } from '@/shared/components';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/config/api';
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
  const { user, isAuthenticated } = useAuth();
  const isMinimal = variant === 'minimal';
  const [targetStats, setTargetStats] = useState({
    completed: 0,
    total: 0,
    fiscalYear: 0,
    pendingApprovals: 0,
    activityAlerts: 0,
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchTargetStats();
      fetchNotifications();
    }
  }, [user, isAuthenticated]);

  const fetchTargetStats = async () => {
    try {
      const response = await api.get('/stats/target-completion');
      const data = response.data.data || response.data;
      setTargetStats({
        completed: data.completedTargets || 0,
        total: data.totalTargets || 0,
        fiscalYear: data.fiscalYear || 0,
        pendingApprovals: data.pendingApprovals || 0,
        activityAlerts: data.activityAlerts || 0,
      });
    } catch (error) {
      // Silently ignore errors - axios interceptor will handle 401
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/approval/notifications');
      setNotifications(response.data || []);
      setUnreadCount(response.data?.filter((n: any) => !n.is_read).length || 0);
    } catch (error) {
      // Silently ignore errors - axios interceptor will handle 401
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/approval/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      // Silently ignore errors - axios interceptor will handle 401
    }
  };

  if (isMinimal) {
    return (
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700">
          DENSO Company KPI
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

        {/* Stats Badge Group */}
        {user && targetStats.total > 0 && (
          <div className="flex items-center gap-2">
            {/* FY Year */}
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
              FY{targetStats.fiscalYear}
            </div>

            {/* Target Completion */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
              {targetStats.completed}/{targetStats.total} Targets
            </div>

            {/* Pending Approvals */}
            {targetStats.pendingApprovals > 0 && (
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md animate-pulse">
                {targetStats.pendingApprovals} Pending
              </div>
            )}

            {/* Activity Alerts */}
            {targetStats.activityAlerts > 0 && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md animate-pulse">
                {targetStats.activityAlerts} Alerts
              </div>
            )}
          </div>
        )}

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
