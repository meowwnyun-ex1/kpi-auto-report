'use client';

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, FileText, Package, BarChart3, Image, MapPin, Folder, Database } from 'lucide-react';
import { NavUser } from './nav-user';

export function AppSidebar() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Check if user is admin based on auth context
  const isAdmin =
    (isAuthenticated && user?.role === 'admin') || (isAuthenticated && user?.role === 'superadmin');

  // Function to check if a menu item is active based on current path
  const isMenuItemActive = (url: string) => {
    const currentPath = location.pathname;

    // Check if current path is a form page
    const isFormPage =
      currentPath === '/Form' ||
      currentPath.includes('/admin/applications/add') ||
      currentPath.includes('/admin/applications/edit/') ||
      currentPath.includes('/admin/categories/add') ||
      currentPath.includes('/admin/categories/edit/') ||
      currentPath.includes('/admin/banners/add') ||
      currentPath.includes('/admin/banners/edit/') ||
      currentPath.includes('/admin/trips/add') ||
      currentPath.includes('/admin/trips/edit/') ||
      currentPath.includes('/user/banners/') ||
      currentPath.includes('/user/trips/') ||
      currentPath.includes('/user/categories/');

    // If on form page, show appropriate active item
    if (isFormPage) {
      if (currentPath === '/Form') return url === '/Form'; // Form page is active when on /Form
      if (currentPath.includes('/admin/applications/')) return url === '/admin/applications'; // Admin App Forms show Applications
      if (currentPath.includes('/admin/categories/')) return url === '/admin/categories'; // Admin Category Forms show Categories
      if (currentPath.includes('/admin/banners/')) return url === '/admin/banners'; // Admin Banner Forms show Banners
      if (currentPath.includes('/admin/trips/')) return url === '/admin/trips'; // Admin Trip Forms show Trips
      if (currentPath.includes('/user/banners/')) return url === '/'; // User Banner Forms show Home
      if (currentPath.includes('/user/trips/')) return url === '/'; // User Trip Forms show Home
      if (currentPath.includes('/user/categories/')) return url === '/'; // User Category Forms show Home

      // For /Form page, only show Form as active, nothing else
      if (currentPath === '/Form') {
        return url === '/Form';
      }

      return false;
    }

    // Normal active check
    return currentPath === url;
  };

  const data = {
    user: {
      name: isAuthenticated ? user?.full_name || 'Admin' : 'Denso User',
      email: user?.email || 'user@ap.denso.com',
      avatar: user?.avatar || '/Avatar.jpg',
    },
    navMain: [
      {
        title: 'Home',
        url: '/',
        icon: Home,
        isActive: isMenuItemActive('/'),
      },
      {
        title: 'Application Form',
        url: '/Form',
        icon: FileText,
        isActive: isMenuItemActive('/Form'),
      },
    ],
    navAdmin: isAdmin
      ? [
          {
            title: 'Overview',
            url: '/admin',
            icon: BarChart3,
            isActive: isMenuItemActive('/admin'),
          },
          {
            title: 'Applications',
            url: '/admin/applications',
            icon: Package,
            isActive: isMenuItemActive('/admin/applications'),
          },
          {
            title: 'Categories',
            url: '/admin/categories',
            icon: Folder,
            isActive: isMenuItemActive('/admin/categories'),
          },
          {
            title: 'Banners',
            url: '/admin/banners',
            icon: Image,
            isActive: isMenuItemActive('/admin/banners'),
          },
          {
            title: 'Trips',
            url: '/admin/trips',
            icon: MapPin,
            isActive: isMenuItemActive('/admin/trips'),
          },
          {
            title: 'Storage',
            url: '/admin/storage',
            icon: Database,
            isActive: isMenuItemActive('/admin/storage'),
          },
        ]
      : [],
  };

  // Render a single menu item
  const renderMenuItem = (item: any, isAdminSection: boolean = false) => {
    const activeClass = isAdminSection
      ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-900 font-semibold border-l-[3px] border-indigo-500 shadow-sm'
      : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-900 font-semibold border-l-[3px] border-blue-500 shadow-sm';
    const hoverClass = isAdminSection
      ? 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 hover:text-indigo-800'
      : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-800';

    return (
      <div key={item.title} className="rounded-lg">
        <Link
          to={item.url}
          className={`
            ${item.isActive ? activeClass : hoverClass}
            transition-all duration-200 rounded-lg px-3 py-2 flex items-center gap-3 w-full`}>
          <item.icon className={`size-4 ${item.isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
          <span className={`font-medium ${item.isActive ? 'text-indigo-900' : 'text-gray-700'}`}>
            {item.title}
          </span>
        </Link>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen border-r border-gray-200/60 bg-white/95 backdrop-blur-md shadow-sm">
      {/* Sidebar Header */}
      <div className="flex-shrink-0 border-b border-gray-200/60 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">DENSO</h2>
            <p className="text-xs text-gray-600">App Store</p>
          </div>
        </div>
      </div>

      {/* Sidebar Content - Takes all available space */}
      <div className="flex-1 px-3 py-4 overflow-y-auto flex flex-col">
        {/* Main Navigation */}
        <div className="space-y-4 mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>
          <div className="space-y-1">{data.navMain.map((item) => renderMenuItem(item, false))}</div>
        </div>

        {/* Admin Section - Always expanded when admin */}
        {isAdmin && (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider px-3 mb-2">
              Admin Panel
            </div>
            <div className="space-y-1">
              {data.navAdmin.map((item) => renderMenuItem(item, true))}
            </div>
          </div>
        )}

        {/* Spacer to push footer to bottom */}
        <div className="flex-1"></div>
      </div>

      {/* Sidebar Footer - Always at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200/60 bg-gradient-to-r from-gray-50 to-blue-50">
        <NavUser user={data.user} />
      </div>
    </div>
  );
}
