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
  KeyRound,
  Target,
  Tags,
  ListChecks,
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
import { Badge } from '@/components/ui/badge';
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
  disabled?: boolean;
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
    {
      title: 'Yearly',
      url: '/yearly',
      icon: Calendar,
      children: [{ title: 'Yearly Target', url: '/yearly-targets', icon: Target }],
    },
    {
      title: 'Monthly',
      url: '/monthly',
      icon: ClipboardList,
      children: [
        { title: 'Monthly Target', url: '/monthly-targets', icon: Target },
        { title: 'Monthly Result', url: '/monthly-result', icon: ClipboardList },
      ],
    },
    { title: 'Action Plans', url: '/action-plans', icon: GanttChart, disabled: true },
  ],
};

// Admin - Admin/SuperAdmin access
const ADMIN_MENU: NavItem = {
  title: 'Admin Dashboard',
  url: '/admin',
  icon: Settings,
  children: [
    { title: 'User Management', url: '/admin/users', icon: Users },
    { title: 'Employees', url: '/admin/employees', icon: UserPlus },
    { title: 'KPI Configuration', url: '/admin/categories', icon: Settings },
    { title: 'System Settings', url: '/admin/settings', icon: Settings },
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

const SIDEBAR_STATE_KEY = 'sidebar-open-categories';

export function AppSidebar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize from localStorage to persist state across refreshes
  const [openCategories, setOpenCategories] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever openCategories changes
  React.useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(openCategories));
    } catch {
      // Ignore storage errors
    }
  }, [openCategories]);

  // Check if user has Manager or Admin role
  const isManagerOrAdmin =
    isAuthenticated &&
    (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager');

  const isAdminRole =
    (isAuthenticated && user?.role === 'admin') || (isAuthenticated && user?.role === 'superadmin');

  // Toggle category expansion; if already open and active, navigate to root URL
  const toggleCategory = (url: string) => {
    setOpenCategories((prev) => {
      const newState = prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url];
      return newState;
    });
  };

  const userBlock = {
    name: isAuthenticated ? user?.full_name || 'User' : 'Guest',
    email: user?.email || 'guest@denso.com',
    avatar: user?.avatar || '/Avatar.png',
    role: user?.role || 'guest',
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

  const handleChangePassword = () => {
    navigate('/change-password');
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
            <span className="text-sm font-bold text-gray-900 truncate">KPI Management Tool</span>
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
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
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
                    onClick={() => navigate(DASHBOARD_MENU.url)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isPathActive(location.pathname, DASHBOARD_MENU.url)
                        ? 'bg-sky-100 text-sky-700 border-l-4 border-sky-600'
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
                                ? 'bg-sky-100 text-sky-700 border-l-4 border-sky-500'
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
              KPI Management
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              {KPI_MANAGEMENT_MENU.children?.map((child) => {
                const hasChildren = child.children && child.children.length > 0;
                const isActive = location.pathname === child.url;
                const isChildActive =
                  hasChildren && child.children?.some((c) => location.pathname === c.url);
                const isDisabled = child.disabled;

                return (
                  <Collapsible
                    key={child.url}
                    open={openCategories.includes(child.url)}
                    onOpenChange={() => !isDisabled && toggleCategory(child.url)}
                    className="group/collapsible">
                    <SidebarMenuItem>
                      {hasChildren ? (
                        <>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              onClick={() =>
                                !isDisabled &&
                                child.children?.[0] &&
                                navigate(child.children[0].url)
                              }
                              className={cn(
                                'w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isDisabled && 'opacity-50 cursor-not-allowed',
                                !isDisabled && (isActive || isChildActive)
                                  ? 'bg-green-100 text-green-700 border-l-4 border-green-600'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              )}>
                              <child.icon
                                className={cn(
                                  'h-4 w-4',
                                  isDisabled
                                    ? 'text-gray-300'
                                    : isActive || isChildActive
                                      ? 'text-green-600'
                                      : 'text-gray-400'
                                )}
                              />
                              <span className="flex-1">{child.title}</span>
                              {!isDisabled &&
                                (openCategories.includes(child.url) || isChildActive ? (
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                ))}
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          {!isDisabled && (
                            <CollapsibleContent>
                              <SidebarMenuSub className="ml-4 mt-1 space-y-1">
                                {child.children?.map((subChild) => {
                                  const subActive = location.pathname === subChild.url;
                                  return (
                                    <SidebarMenuSubItem key={subChild.url}>
                                      <SidebarMenuSubButton
                                        asChild
                                        className={cn(
                                          'w-full rounded-lg px-3 py-2 text-sm transition-colors',
                                          subActive
                                            ? 'bg-green-100 text-green-700 border-l-4 border-green-500'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        )}>
                                        <Link to={subChild.url} className="flex items-center gap-2">
                                          <subChild.icon className="h-4 w-4" />
                                          <span>{subChild.title}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          )}
                        </>
                      ) : (
                        <SidebarMenuButton
                          asChild={!isDisabled}
                          className={cn(
                            'w-full rounded-lg px-3 py-2 text-sm transition-colors',
                            isDisabled && 'opacity-50 cursor-not-allowed',
                            !isDisabled && isActive
                              ? 'bg-green-100 text-green-700 border-l-4 border-green-600'
                              : 'text-gray-600 hover:bg-gray-50'
                          )}>
                          {isDisabled ? (
                            <span className="flex items-center gap-2">
                              <child.icon className="h-4 w-4 text-gray-300" />
                              <span>{child.title}</span>
                              <Lock className="h-3 w-3 text-gray-400 ml-auto" />
                            </span>
                          ) : (
                            <Link to={child.url} className="flex items-center gap-2">
                              <child.icon className="h-4 w-4" />
                              <span>{child.title}</span>
                            </Link>
                          )}
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
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
                      location.pathname === child.url ||
                        (location.pathname === '/admin' &&
                          location.search.includes(child.url.split('tab=')[1] || ''))
                        ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-600'
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
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userBlock.avatar} alt={userBlock.name} />
                  <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                    {userBlock.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isAuthenticated && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">{userBlock.name}</p>
                <p className="text-xs text-gray-500 truncate">{userBlock.email}</p>
              </div>
              <ChevronUp className="h-4 w-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48 mb-2">
            {isAuthenticated ? (
              <>
                <DropdownMenuItem
                  onClick={handleChangePassword}
                  className="flex items-center gap-2 cursor-pointer">
                  <KeyRound className="h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 cursor-pointer text-red-600">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </>
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
