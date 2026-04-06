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

// KPI Categories - Data Entry only (Manager/Admin access)
const KPI_DATA_ENTRY: NavItem[] = [
  {
    title: 'Safety',
    url: '/safety',
    icon: Shield,
    children: [
      { title: 'Data Entry', url: '/safety/entry', icon: ClipboardList },
      { title: 'By Department', url: '/safety/dept', icon: Building2 },
    ],
  },
  {
    title: 'Quality',
    url: '/quality',
    icon: Award,
    children: [
      { title: 'Data Entry', url: '/quality/entry', icon: ClipboardList },
      { title: 'By Department', url: '/quality/dept', icon: Building2 },
    ],
  },
  {
    title: 'Delivery',
    url: '/delivery',
    icon: Truck,
    children: [
      { title: 'Data Entry', url: '/delivery/entry', icon: ClipboardList },
      { title: 'By Department', url: '/delivery/dept', icon: Building2 },
    ],
  },
  {
    title: 'Compliance',
    url: '/compliance',
    icon: FileCheck,
    children: [
      { title: 'Data Entry', url: '/compliance/entry', icon: ClipboardList },
      { title: 'By Department', url: '/compliance/dept', icon: Building2 },
    ],
  },
  {
    title: 'HR',
    url: '/hr',
    icon: Users,
    children: [
      { title: 'Data Entry', url: '/hr/entry', icon: ClipboardList },
      { title: 'By Department', url: '/hr/dept', icon: Building2 },
    ],
  },
  {
    title: 'Attractive',
    url: '/attractive',
    icon: Star,
    children: [
      { title: 'Data Entry', url: '/attractive/entry', icon: ClipboardList },
      { title: 'By Department', url: '/attractive/dept', icon: Building2 },
    ],
  },
  {
    title: 'Environment',
    url: '/environment',
    icon: Leaf,
    children: [
      { title: 'Data Entry', url: '/environment/entry', icon: ClipboardList },
      { title: 'By Department', url: '/environment/dept', icon: Building2 },
    ],
  },
  {
    title: 'Cost',
    url: '/cost',
    icon: DollarSign,
    children: [
      { title: 'Data Entry', url: '/cost/entry', icon: ClipboardList },
      { title: 'By Department', url: '/cost/dept', icon: Building2 },
    ],
  },
];

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
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === '/dashboard'}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  location.pathname === '/dashboard'
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}>
                <Link to="/dashboard" className="flex items-center gap-3">
                  <LayoutDashboard
                    className={cn(
                      'h-5 w-5',
                      location.pathname === '/dashboard' ? 'text-sky-600' : 'text-gray-400'
                    )}
                  />
                  <span>KPI Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* KPI Categories - Data Entry (Manager/Admin only) */}
        {isManagerOrAdmin && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
              <Lock className="h-3 w-3" />
              KPI Data Entry
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              {KPI_DATA_ENTRY.map((category) => {
                const isActive = isPathActive(location.pathname, category.url);
                const isOpen = openCategories.includes(category.url);

                return (
                  <Collapsible
                    key={category.url}
                    open={isOpen}
                    onOpenChange={() => toggleCategory(category.url)}
                    className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={cn(
                            'w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}>
                          <category.icon
                            className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-400')}
                          />
                          <span className="flex-1">{category.title}</span>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="ml-4 mt-1 space-y-1">
                          {category.children?.map((child) => {
                            const childActive = location.pathname === child.url;
                            return (
                              <SidebarMenuSubItem key={child.url}>
                                <SidebarMenuSubButton
                                  asChild
                                  className={cn(
                                    'w-full rounded-lg px-3 py-2 text-sm transition-colors',
                                    childActive
                                      ? 'bg-blue-100 text-blue-700'
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
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Admin Menu - Only for admins */}
        {isAdminRole && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">
              Administration
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/admin'}
                  className={cn(
                    'w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    location.pathname === '/admin'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}>
                  <Link to="/admin" className="flex items-center gap-3">
                    <BarChart3
                      className={cn(
                        'h-5 w-5',
                        location.pathname === '/admin' ? 'text-blue-600' : 'text-gray-400'
                      )}
                    />
                    <span>Admin Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
