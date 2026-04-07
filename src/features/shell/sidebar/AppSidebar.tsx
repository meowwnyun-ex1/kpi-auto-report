import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Shield,
  Award,
  Truck,
  FileCheck,
  Users,
  UserPlus,
  Star,
  Leaf,
  DollarSign,
  LogOut,
  LogIn,
  ChevronUp,
  BarChart3,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Building2,
  LayoutDashboard,
  Lock,
  Settings,
  FileText,
  Eye,
  Calendar,
  GanttChart,
  FormInput,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
};

// Dashboard - Single entry for all dashboards
const DASHBOARD_MENU: NavItem = {
  title: 'Dashboard',
  url: '/dashboard',
  icon: LayoutDashboard,
  children: [
    { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Safety', url: '/dashboard/safety', icon: Shield },
    { title: 'Quality', url: '/dashboard/quality', icon: Award },
    { title: 'Delivery', url: '/dashboard/delivery', icon: Truck },
    { title: 'Compliance', url: '/dashboard/compliance', icon: FileCheck },
    { title: 'HR', url: '/dashboard/hr', icon: Users },
    { title: 'Attractive', url: '/dashboard/attractive', icon: Star },
    { title: 'Environment', url: '/dashboard/environment', icon: Leaf },
    { title: 'Cost', url: '/dashboard/cost', icon: DollarSign },
  ],
};

// KPI Management - Manager/Admin access
const KPI_MANAGEMENT_MENU: NavItem = {
  title: 'KPI Management',
  url: '/kpi-management',
  icon: ClipboardList,
  children: [
    { title: 'Overview', url: '/overview', icon: BarChart3 },
    { title: 'Yearly Targets', url: '/yearly-targets', icon: Calendar },
    { title: 'Monthly Entry', url: '/monthly-entry', icon: ClipboardList },
    { title: 'Action Plans', url: '/action-plans', icon: GanttChart },
  ],
};

// Admin - Admin/SuperAdmin access
const ADMIN_MENU: NavItem = {
  title: 'Admin',
  url: '/admin',
  icon: Settings,
  children: [
    { title: 'Users', url: '/admin?tab=users', icon: Users },
    { title: 'Add New User', url: '/admin?tab=employees', icon: UserPlus },
    { title: 'Settings', url: '/admin?tab=settings', icon: Settings },
  ],
};

function normalizePath(p: string) {
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
  return p;
}

function isPathActive(current: string, itemUrl: string): boolean {
  const c = normalizePath(current);
  const u = normalizePath(itemUrl);

  if (u === '/') {
    return c === '/' || c === '/index';
  }

  return c === u || c.startsWith(`${u}/`);
}

export function AppSidebar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openCategories, setOpenCategories] = React.useState<string[]>([]);

  // Check if user has Manager or Admin role
  const isManagerOrAdmin =
    isAuthenticated &&
    (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager');

  const isAdminRole =
    (isAuthenticated && user?.role === 'admin') || (isAuthenticated && user?.role === 'superadmin');

  // Toggle category expansion
  const toggleCategory = (url: string) => {
    setOpenCategories((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const userBlock = {
    name: isAuthenticated ? user?.full_name || 'User' : 'Guest',
    email: user?.email || 'guest@denso.com',
    avatar: user?.avatar || '/Avatar.png',
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <Sidebar className="border-r border-gray-200">
      {/* Logo & System Name */}
      <SidebarHeader className="border-b border-gray-100 bg-white h-14 px-4 flex items-center">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="DENSO Logo"
            className="h-10 w-auto object-contain flex-shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate">KPI Auto Report</span>
            <span className="text-xs text-gray-500">DENSO Performance System</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="bg-white px-3 py-4 overflow-y-auto">
        {/* Dashboard Menu - Main overview for all users */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">
            Menu
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === '/'}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  location.pathname === '/'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}>
                <Link to="/" className="flex items-center gap-3">
                  <Home
                    className={cn(
                      'h-5 w-5',
                      location.pathname === '/' ? 'text-blue-600' : 'text-gray-400'
                    )}
                  />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Dashboard with sub-menus */}
            <Collapsible
              open={openCategories.includes(DASHBOARD_MENU.url)}
              onOpenChange={() => toggleCategory(DASHBOARD_MENU.url)}
              className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className={cn(
                      'w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isPathActive(location.pathname, DASHBOARD_MENU.url)
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}>
                    <DASHBOARD_MENU.icon
                      className={cn(
                        'h-5 w-5',
                        isPathActive(location.pathname, DASHBOARD_MENU.url)
                          ? 'text-sky-600'
                          : 'text-gray-400'
                      )}
                    />
                    <span className="flex-1">{DASHBOARD_MENU.title}</span>
                    {openCategories.includes(DASHBOARD_MENU.url) ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="ml-4 mt-1 space-y-1">
                    {DASHBOARD_MENU.children?.map((child) => {
                      const childActive = location.pathname === child.url;
                      return (
                        <SidebarMenuSubItem key={child.url}>
                          <SidebarMenuSubButton
                            asChild
                            className={cn(
                              'w-full rounded-lg px-3 py-2 text-sm transition-colors',
                              childActive
                                ? 'bg-sky-100 text-sky-700'
                                : 'text-gray-600 hover:bg-gray-50'
                            )}>
                            <Link to={child.url} className="flex items-center gap-2">
                              <child.icon className="h-4 w-4" />
                              <span>{child.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>

        {/* KPI Management - Manager/Admin only */}
        {isManagerOrAdmin && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
              <Lock className="h-3 w-3" />
              KPI Management
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              {KPI_MANAGEMENT_MENU.children?.map((child) => (
                <SidebarMenuItem key={child.url}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-sm transition-colors',
                      location.pathname === child.url
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}>
                    <Link to={child.url} className="flex items-center gap-2">
                      <child.icon className="h-4 w-4" />
                      <span>{child.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Admin - Only for admins */}
        {isAdminRole && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">
              Admin
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              {ADMIN_MENU.children?.map((child) => (
                <SidebarMenuItem key={child.url}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-sm transition-colors',
                      location.pathname === '/admin' &&
                        location.search.includes(child.url.split('tab=')[1] || '')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}>
                    <Link to={child.url} className="flex items-center gap-2">
                      <child.icon className="h-4 w-4" />
                      <span>{child.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* User Profile */}
      <SidebarFooter className="border-t border-gray-100 bg-white p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userBlock.avatar} alt={userBlock.name} />
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                  {userBlock.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">{userBlock.name}</p>
                <p className="text-xs text-gray-500 truncate">{userBlock.email}</p>
              </div>
              <ChevronUp className="h-4 w-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48 mb-2">
            {isAuthenticated ? (
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer text-red-600">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={handleLogin}
                className="flex items-center gap-2 cursor-pointer">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
