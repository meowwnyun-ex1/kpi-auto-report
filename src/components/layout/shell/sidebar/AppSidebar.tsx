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
  CalendarDays,
  GanttChart,
  FormInput,
  KeyRound,
  Target,
  Tags,
  ListChecks,
  AlertTriangle,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/shared/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    {
      title: 'Yearly',
      url: '/yearly',
      icon: Calendar,
      children: [{ title: 'Target', url: '/yearly-targets', icon: Target }],
    },
    {
      title: 'Monthly',
      url: '/monthly',
      icon: CalendarDays,
      children: [
        { title: 'Target', url: '/monthly-targets', icon: Target },
        { title: 'Result', url: '/monthly-result', icon: FileCheck },
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
    { title: 'Approval Routes', url: '/admin/approval-routes', icon: Shield },
    { title: 'System Settings', url: '/admin/settings', icon: Settings },
    { title: 'Error Testing', url: '/test-errors', icon: AlertTriangle },
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

  // Auto-expand active menu items based on current location
  React.useEffect(() => {
    const currentPath = location.pathname;
    const newOpenCategories: string[] = [];

    // Check Dashboard menu items
    if (isPathActive(currentPath, DASHBOARD_MENU.url)) {
      newOpenCategories.push(DASHBOARD_MENU.url);
    }

    // Check KPI Management menu items
    if (KPI_MANAGEMENT_MENU.children) {
      KPI_MANAGEMENT_MENU.children.forEach((child) => {
        if (isPathActive(currentPath, child.url)) {
          newOpenCategories.push(child.url);
        }
        // Check sub-menu items
        if (child.children) {
          child.children.forEach((subChild) => {
            if (currentPath === subChild.url) {
              newOpenCategories.push(child.url);
            }
          });
        }
      });
    }

    // Check Admin menu items
    if (ADMIN_MENU.children) {
      ADMIN_MENU.children.forEach((child) => {
        if (currentPath === child.url) {
          newOpenCategories.push(ADMIN_MENU.url);
        }
      });
    }

    if (newOpenCategories.length > 0) {
      setOpenCategories(newOpenCategories);
    }
  }, [location.pathname]);

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
      // Clear sidebar state from localStorage when logout
      try {
        localStorage.removeItem(SIDEBAR_STATE_KEY);
      } catch {
        // Ignore storage errors
      }
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
    <Sidebar className="border-r border-gray-200/60 bg-gradient-to-b from-white to-gray-50/50">
      {/* Logo & System Name */}
      <SidebarHeader className="border-b border-gray-200/60 bg-gradient-to-r from-blue-50 to-indigo-50 h-14 px-4 flex items-center shadow-sm transition-all duration-200">
        <div className="flex items-center gap-3 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 rounded-lg px-2 py-1 -mx-2 -my-1 transition-all duration-200 cursor-pointer">
          <div className="relative">
            <Link to="/">
              <img
                src="/logo.png"
                alt="DENSO Logo"
                className="h-8 w-auto object-contain flex-shrink-0 transition-transform hover:scale-105"
              />
            </Link>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <div className="flex flex-col min-w-0">
            <Link to="/">
              <span className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                KPI Management
              </span>
            </Link>
            <span className="text-xs text-gray-600 font-medium truncate">
              DENSO Performance System
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="bg-white/80 backdrop-blur-sm px-4 py-6 overflow-y-auto scroll-smooth">
        {/* Dashboard Menu - Main overview for all users */}
        <SidebarGroup className="mb-4">
          <SidebarGroupLabel className="px-2 mb-2 text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
            <span>Main Menu</span>
            <div className="h-px bg-blue-300 flex-1"></div>
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === '/'}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  location.pathname === '/'
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                )}>
                <Link to="/" className="flex items-center gap-3">
                  <Home
                    className={cn(
                      'h-4 w-4',
                      location.pathname === '/' ? 'text-blue-600' : 'text-gray-400'
                    )}
                  />
                  <span className="truncate">Home</span>
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
                    asChild
                    isActive={isPathActive(location.pathname, DASHBOARD_MENU.url)}
                    onClick={(e) => {
                      if (DASHBOARD_MENU.children && DASHBOARD_MENU.children.length > 0) {
                        e.preventDefault();
                        // Check if currently on a child page
                        const isOnChildPage = DASHBOARD_MENU.children.some(
                          (child) => location.pathname === child.url
                        );
                        // If on child page, go to main parent; otherwise go to first child
                        if (isOnChildPage) {
                          navigate(DASHBOARD_MENU.url);
                        } else {
                          navigate(DASHBOARD_MENU.children[0].url);
                        }
                        // Also expand the menu
                        if (!openCategories.includes(DASHBOARD_MENU.url)) {
                          toggleCategory(DASHBOARD_MENU.url);
                        }
                      }
                    }}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                      location.pathname === DASHBOARD_MENU.url
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                    )}>
                    <Link to={DASHBOARD_MENU.url} className="flex items-center gap-3">
                      <DASHBOARD_MENU.icon
                        className={cn(
                          'h-4 w-4',
                          location.pathname === DASHBOARD_MENU.url
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        )}
                      />
                      <span className="flex-1 truncate">{DASHBOARD_MENU.title}</span>
                      {openCategories.includes(DASHBOARD_MENU.url) ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="ml-6 mt-2 space-y-1">
                    {DASHBOARD_MENU.children?.map((child) => {
                      const childActive = location.pathname === child.url;
                      return (
                        <SidebarMenuSubItem key={child.url}>
                          <SidebarMenuSubButton
                            asChild
                            className={cn(
                              'w-full rounded-lg px-3 py-2 text-sm transition-colors',
                              childActive
                                ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-800'
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
          <SidebarGroup className="mb-4">
            <SidebarGroupLabel className="px-2 mb-4 text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-2">
              <span>KPI Management</span>
              <div className="h-px bg-green-300 flex-1"></div>
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
                    onOpenChange={() => !isDisabled && toggleCategory(child.url)}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          onClick={(e) => {
                            if (!isDisabled) {
                              // Navigate to first child if it has children
                              if (hasChildren && child.children && child.children.length > 0) {
                                e.preventDefault();
                                // Check if currently on a child page
                                const isOnChildPage = child.children.some(
                                  (subChild) => location.pathname === subChild.url
                                );
                                // If on child page, go to main parent; otherwise go to first child
                                if (isOnChildPage) {
                                  navigate(child.url);
                                } else {
                                  navigate(child.children[0].url);
                                }
                                // Also expand the menu
                                if (!openCategories.includes(child.url)) {
                                  toggleCategory(child.url);
                                }
                              } else if (isActive || isChildActive) {
                                e.preventDefault();
                                navigate(child.url);
                              }
                            }
                          }}
                          className={cn(
                            'w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                            isDisabled && 'opacity-50 cursor-not-allowed',
                            !isDisabled && isActive
                              ? 'bg-green-100 text-green-700 border-l-4 border-green-600'
                              : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                          )}>
                          <Link to={child.url} className="flex items-center gap-3">
                            <child.icon
                              className={cn(
                                'h-4 w-4',
                                isDisabled
                                  ? 'text-gray-300'
                                  : isActive
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                              )}
                            />
                            <span className="flex-1 truncate">{child.title}</span>
                            {!isDisabled &&
                              (openCategories.includes(child.url) || isChildActive ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              ))}
                          </Link>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!isDisabled && (
                        <CollapsibleContent>
                          <SidebarMenuSub className="ml-6 mt-2 space-y-1">
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
                                        : 'text-gray-600 hover:bg-green-50'
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
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Admin - Only for admins */}
        {isAdminRole && (
          <SidebarGroup className="mb-4">
            <SidebarGroupLabel className="px-2 mb-4 text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2">
              <span>Administration</span>
              <div className="h-px bg-purple-300 flex-1"></div>
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              {ADMIN_MENU.children?.map((child) => (
                <SidebarMenuItem key={child.url}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                      location.pathname === child.url
                        ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-600'
                        : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                    )}>
                    <Link to={child.url} className="flex items-center gap-3">
                      <child.icon
                        className={cn(
                          'h-4 w-4',
                          location.pathname === child.url ? 'text-purple-600' : 'text-gray-400'
                        )}
                      />
                      <span className="truncate">{child.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* User Profile */}
      <SidebarFooter className="border-t border-gray-200/60 bg-gradient-to-r from-gray-50 to-white p-3 shadow-md transition-all duration-200">
        <div className="hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 rounded-lg px-2 py-1 -mx-2 -my-1 transition-all duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 p-1.5 rounded-md bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
                <div className="relative">
                  <Avatar className="h-6 w-6 ring-1 ring-gray-100 hover:ring-blue-100 transition-all">
                    <AvatarImage src={userBlock.avatar} alt={userBlock.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                      {userBlock.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isAuthenticated && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold text-gray-900 truncate">{userBlock.name}</p>
                  <p className="text-xs text-gray-500 truncate">{userBlock.email}</p>
                </div>
                <ChevronUp className="h-4 w-4 text-gray-400 hover:text-gray-700 transition-colors" />
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
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
