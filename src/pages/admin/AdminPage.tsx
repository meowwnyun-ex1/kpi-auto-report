import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmDialog } from '@/components/ui';
// import { Button } from '@/components/ui/button';
import { ShellLayout } from '@/features/shell';
import AdminApplications from './AdminApplications';
import AdminCategories from './AdminCategories';
import AdminBanners from './AdminBanners';
import AdminTrips from './AdminTrips';
import { AdminStorage } from './AdminStorage';
import AdminDashboard from './AdminDashboard';
import { BannerForm, TripForm, CategoryForm, AdminApplicationForm } from '../../components/forms';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/shared/utils';
import { getApiUrl } from '@/config/api';
import { handleSessionValidation, handleAuthError } from '@/shared/utils/session-manager';
import { Category, Application, Stats } from '@/shared/types';
import { TOAST_MESSAGES, DIALOG_TEXTS, STATUS_TOGGLE_MESSAGES } from '@/shared/constants';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { showDialog, ConfirmDialogComponent } = useConfirmDialog();
  const [dataFetched, setDataFetched] = useState(false);

  // Derive active tab from URL path - reactive to navigation changes
  const getActiveTabFromPath = (path: string) => {
    if (path === '/admin' || path === '/admin/') return 'dashboard';
    if (path.startsWith('/admin/dashboard')) return 'dashboard';
    if (path.startsWith('/admin/applications') || path === '/admin/pending') return 'applications';
    if (path.startsWith('/admin/categories')) return 'categories';
    if (path.startsWith('/admin/banners')) return 'banners';
    if (path.startsWith('/admin/trips')) return 'trips';
    if (path.startsWith('/admin/storage')) return 'storage';
    return 'dashboard';
  };

  // Check if URL indicates add/edit mode
  const getFormModeFromPath = (path: string) => {
    if (path.includes('/Form') || path.includes('/add')) return 'add';
    if (path.includes('/edit')) return 'edit';
    return null;
  };

  const activeTab = getActiveTabFromPath(location.pathname);
  const formMode = getFormModeFromPath(location.pathname);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalApps: 0,
    pendingApps: 0,
    approvedApps: 0,
    rejectedApps: 0,
    totalViews: 0,
    totalUsers: 0,
    totalCategories: 0,
    activeBanners: 0,
    totalBanners: 0,
    activeTrips: 0,
    totalTrips: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [initialDataLoading, setInitialDataLoading] = useState(true);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [isAddingApp, setIsAddingApp] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_actionLoading, setActionLoading] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [isAddingTrip, setIsAddingTrip] = useState(false);

  // Fetch applications - public endpoint, no auth required
  const fetchApplications = useCallback(async () => {
    try {
      const token = storage.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiUrl()}/apps?limit=500&status=`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError(response, logout, navigate, toast);
        }
        return;
      }

      const data = await response.json();
      setApplications(data.data || data.applications || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching applications:', error);
    }
  }, [logout, navigate]);

  // Fetch stats - public endpoint, no auth required
  const fetchStats = useCallback(async () => {
    try {
      const token = storage.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiUrl()}/stats`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError(response, logout, navigate, toast);
        }
        return;
      }

      const data = await response.json();
      // /api/stats returns { success: true, data: { totalApps, pendingApps, totalViews, ... } }
      const statsData = data.data || data;
      setStats({
        totalApps: statsData.totalApps || 0,
        pendingApps: statsData.pendingApps || 0,
        approvedApps: statsData.approvedApps || 0,
        rejectedApps: statsData.rejectedApps || 0,
        totalViews: statsData.totalViews || 0,
        totalUsers: statsData.totalUsers || 0,
        totalCategories: statsData.totalCategories || 0,
        activeBanners: statsData.activeBanners || 0,
        totalBanners: statsData.totalBanners || 0,
        activeTrips: statsData.activeTrips || 0,
        totalTrips: statsData.totalTrips || 0,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching stats:', error);
    }
  }, [logout, navigate]);

  // Fetch categories - public endpoint, no auth required
  const fetchCategories = useCallback(async () => {
    try {
      const token = storage.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiUrl()}/categories`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError(response, logout, navigate, toast);
        }
        return;
      }

      const data = await response.json();
      setCategories(data.data || data.categories || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching categories:', error);
    }
  }, [logout, navigate]);

  // Fetch banners - public endpoint, no auth required
  const fetchBanners = useCallback(async () => {
    try {
      const token = storage.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiUrl()}/banners`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError(response, logout, navigate, toast);
        }
        return;
      }

      const data = await response.json();
      setBanners(data.data || data.banners || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching banners:', error);
    }
  }, [logout, navigate]);

  // Fetch trips - public endpoint, no auth required
  const fetchTrips = useCallback(async () => {
    try {
      const token = storage.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiUrl()}/trips`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleAuthError(response, logout, navigate, toast);
        }
        return;
      }

      const data = await response.json();
      setTrips(data.data || data.trips || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching trips:', error);
    }
  }, [logout, navigate]);

  // Initial data fetch - runs once when component mounts
  // Public endpoints (apps, categories, banners, trips, stats) don't require auth
  useEffect(() => {
    if (dataFetched) return;

    const fetchInitialData = async () => {
      try {
        setInitialDataLoading(true);
        await Promise.allSettled([
          fetchApplications(),
          fetchStats(),
          fetchCategories(),
          fetchBanners(),
          fetchTrips(),
        ]);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching initial data:', error);
      } finally {
        setInitialDataLoading(false);
        setDataFetched(true);
      }
    };

    fetchInitialData();
  }, [dataFetched, fetchApplications, fetchStats, fetchCategories, fetchBanners, fetchTrips]);

  // Handle status change - uses PUT /apps/:id to update the app's status
  const handleStatusChange = async (appId: number, newStatus: string) => {
    if (!handleSessionValidation(logout, navigate, toast)) {
      return;
    }

    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    setActionLoading(appId);

    // Show loading toast
    const loadingToast = toast({
      title: 'Updating status...',
      variant: 'loading',
    });

    try {
      const token = storage.getAuthToken();
      const response = await fetch(`${getApiUrl()}/apps/${appId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchApplications();
        await fetchStats();

        // Dismiss loading toast and show success
        loadingToast.dismiss();
        toast({ title: TOAST_MESSAGES.STATUS_UPDATED, variant: 'success' });
      } else {
        loadingToast.dismiss();
        handleAuthError(response, logout, navigate, toast);
      }
    } catch (error) {
      loadingToast.dismiss();
      if (import.meta.env.DEV) console.error('Error updating status:', error);
      toast({ title: TOAST_MESSAGES.FAILED_UPDATE_STATUS, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle application deletion
  const handleDeleteApplication = (appId: number, appName: string) => {
    showDialog({
      title: DIALOG_TEXTS.DELETE_APPLICATION_TITLE,
      description: DIALOG_TEXTS.DELETE_APPLICATION_DESC(appName),
      confirmText: DIALOG_TEXTS.CONFIRM,
      cancelText: DIALOG_TEXTS.CANCEL,
      variant: 'danger',
      onConfirm: async () => {
        if (!handleSessionValidation(logout, navigate, toast)) {
          return;
        }

        setActionLoading(appId);

        // Show loading toast
        const loadingToast = toast({
          title: 'Deleting application...',
          variant: 'loading',
        });

        try {
          const token = storage.getAuthToken();
          const response = await fetch(`${getApiUrl()}/apps/${appId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            await fetchApplications();
            await fetchStats();

            // Dismiss loading toast and show success
            loadingToast.dismiss();
            toast({ title: TOAST_MESSAGES.APPLICATION_DELETED, variant: 'success' });
          } else {
            loadingToast.dismiss();
            handleAuthError(response, logout, navigate, toast);
          }
        } catch (error) {
          loadingToast.dismiss();
          if (import.meta.env.DEV) console.error('Error deleting application:', error);
          toast({ title: TOAST_MESSAGES.FAILED_DELETE_APPLICATION, variant: 'destructive' });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Handle delete category
  const handleDeleteCategory = async (id: number): Promise<void> => {
    showDialog({
      title: DIALOG_TEXTS.DELETE_CATEGORY_TITLE,
      description: DIALOG_TEXTS.DELETE_CATEGORY_DESC,
      confirmText: DIALOG_TEXTS.CONFIRM,
      cancelText: DIALOG_TEXTS.CANCEL,
      variant: 'danger',
      onConfirm: async () => {
        if (!handleSessionValidation(logout, navigate, toast)) {
          return;
        }

        // Show loading toast
        const loadingToast = toast({
          title: 'Deleting category...',
          variant: 'loading',
        });

        try {
          const token = storage.getAuthToken();
          const response = await fetch(`${getApiUrl()}/categories/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            await fetchCategories();

            // Dismiss loading toast and show success
            loadingToast.dismiss();
            toast({ title: TOAST_MESSAGES.CATEGORY_SAVED, variant: 'success' });
          } else {
            loadingToast.dismiss();
            handleAuthError(response, logout, navigate, toast);
          }
        } catch (error) {
          loadingToast.dismiss();
          if (import.meta.env.DEV) console.error('Error deleting category:', error);
          toast({ title: TOAST_MESSAGES.FAILED_DELETE_CATEGORY, variant: 'destructive' });
        }
      },
    });
  };

  // Handle category status toggle (activate/deactivate)
  const handleCategoryStatusToggle = (category: Category) => {
    showDialog({
      title: category.is_active ? 'Deactivate Category' : 'Activate Category',
      description: category.is_active
        ? `Are you sure you want to deactivate "${category.name}"? It will no longer be visible on the main page.`
        : `Are you sure you want to activate "${category.name}"? It will be visible on the main page.`,
      confirmText: DIALOG_TEXTS.CONFIRM,
      cancelText: DIALOG_TEXTS.CANCEL,
      variant: category.is_active ? 'danger' : undefined,
      onConfirm: async () => {
        if (!handleSessionValidation(logout, navigate, toast)) {
          return;
        }

        const loadingToast = toast({
          title: 'Updating status...',
          variant: 'loading',
        });

        try {
          const token = storage.getAuthToken();
          const formData = new FormData();
          formData.append('name', category.name);
          formData.append('is_active', String(!category.is_active));
          if (category.icon) {
            formData.append('icon', category.icon);
          }
          if (category.image_thumbnail) {
            formData.append('keep_existing_image', 'true');
          }

          const response = await fetch(`${getApiUrl()}/categories/${category.id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (response.ok) {
            await fetchCategories();
            loadingToast.dismiss();
            toast({
              title: category.is_active
                ? STATUS_TOGGLE_MESSAGES.CATEGORY_DEACTIVATED
                : STATUS_TOGGLE_MESSAGES.CATEGORY_ACTIVATED,
              variant: 'success',
            });
          } else {
            loadingToast.dismiss();
            handleAuthError(response, logout, navigate, toast);
          }
        } catch (error) {
          loadingToast.dismiss();
          if (import.meta.env.DEV) console.error('Error updating category status:', error);
          toast({ title: TOAST_MESSAGES.FAILED_SAVE_CATEGORY, variant: 'destructive' });
        }
      },
    });
  };

  // Handle bulk delete categories
  const handleBulkDeleteCategories = async (ids: (string | number)[]): Promise<void> => {
    showDialog({
      title: 'Delete Categories',
      description: `Are you sure you want to delete ${ids.length} categories? This action cannot be undone.`,
      confirmText: DIALOG_TEXTS.CONFIRM,
      cancelText: DIALOG_TEXTS.CANCEL,
      variant: 'danger',
      onConfirm: async () => {
        if (!handleSessionValidation(logout, navigate, toast)) {
          return;
        }

        const loadingToast = toast({
          title: `Deleting ${ids.length} categories...`,
          variant: 'loading',
        });

        try {
          const token = storage.getAuthToken();
          let successCount = 0;
          let failCount = 0;

          for (const id of ids) {
            const response = await fetch(`${getApiUrl()}/categories/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
              successCount++;
            } else {
              failCount++;
            }
          }

          await fetchCategories();
          loadingToast.dismiss();

          if (failCount === 0) {
            toast({ title: `Successfully deleted ${successCount} categories`, variant: 'success' });
          } else {
            toast({
              title: `Deleted ${successCount} categories, failed to delete ${failCount}`,
              variant: 'destructive',
            });
          }
        } catch (error) {
          loadingToast.dismiss();
          if (import.meta.env.DEV) console.error('Error bulk deleting categories:', error);
          toast({ title: 'Failed to delete categories', variant: 'destructive' });
        }
      },
    });
  };

  // Handle bulk activate categories
  const handleBulkActivateCategories = async (ids: (string | number)[]): Promise<void> => {
    if (!handleSessionValidation(logout, navigate, toast)) {
      return;
    }

    const loadingToast = toast({
      title: `Activating ${ids.length} categories...`,
      variant: 'loading',
    });

    try {
      const token = storage.getAuthToken();
      let successCount = 0;

      for (const id of ids) {
        const category = categories.find((c) => c.id === id);
        if (category && !category.is_active) {
          const formData = new FormData();
          formData.append('name', category.name);
          formData.append('is_active', 'true');
          if (category.icon) formData.append('icon', category.icon);
          formData.append('keep_existing_image', 'true');

          const response = await fetch(`${getApiUrl()}/categories/${id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (response.ok) successCount++;
        } else {
          successCount++;
        }
      }

      await fetchCategories();
      loadingToast.dismiss();
      toast({ title: `Activated ${successCount} categories`, variant: 'success' });
    } catch (error) {
      loadingToast.dismiss();
      if (import.meta.env.DEV) console.error('Error bulk activating categories:', error);
      toast({ title: 'Failed to activate categories', variant: 'destructive' });
    }
  };

  // Handle bulk deactivate categories
  const handleBulkDeactivateCategories = async (ids: (string | number)[]): Promise<void> => {
    if (!handleSessionValidation(logout, navigate, toast)) {
      return;
    }

    const loadingToast = toast({
      title: `Deactivating ${ids.length} categories...`,
      variant: 'loading',
    });

    try {
      const token = storage.getAuthToken();
      let successCount = 0;

      for (const id of ids) {
        const category = categories.find((c) => c.id === id);
        if (category && category.is_active) {
          const formData = new FormData();
          formData.append('name', category.name);
          formData.append('is_active', 'false');
          if (category.icon) formData.append('icon', category.icon);
          formData.append('keep_existing_image', 'true');

          const response = await fetch(`${getApiUrl()}/categories/${id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (response.ok) successCount++;
        } else {
          successCount++;
        }
      }

      await fetchCategories();
      loadingToast.dismiss();
      toast({ title: `Deactivated ${successCount} categories`, variant: 'success' });
    } catch (error) {
      loadingToast.dismiss();
      if (import.meta.env.DEV) console.error('Error bulk deactivating categories:', error);
      toast({ title: 'Failed to deactivate categories', variant: 'destructive' });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_bannersCurrentPage, setBannersCurrentPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_tripsCurrentPage, setTripsCurrentPage] = useState(1);

  // Pagination
  const [categoriesCurrentPage, setCategoriesCurrentPage] = useState(1);
  const [applicationsCurrentPage, setApplicationsCurrentPage] = useState(1);

  // Redirect to login if auth check is done and user is not authenticated
  // Store intended destination for redirect after login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      sessionStorage.setItem('adminRedirectTo', location.pathname);
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate, location.pathname]);

  // Handle form mode changes from URL
  useEffect(() => {
    if (formMode === 'add' && activeTab === 'applications') {
      setIsAddingApp(true);
      setEditingApp(null);
    } else if (formMode === 'edit' && activeTab === 'applications') {
      // Extract app ID from URL for edit mode
      const pathMatch = location.pathname.match(/\/admin\/applications\/edit\/(\d+)/);
      if (pathMatch) {
        const appId = parseInt(pathMatch[1]);
        const app = applications.find((a) => a.id === appId);
        if (app) {
          setEditingApp(app);
          setIsAddingApp(false);
        }
      }
    } else if (formMode === 'add' && activeTab === 'categories') {
      setIsAddingCategory(true);
      setEditingCategory(null);
    } else if (formMode === 'edit' && activeTab === 'categories') {
      // Extract category ID from URL for edit mode
      const pathMatch = location.pathname.match(/\/admin\/categories\/edit\/(\d+)/);
      if (pathMatch) {
        // TODO: Fetch category data
        setEditingCategory({ id: parseInt(pathMatch[1]) } as Category);
        setIsAddingCategory(false);
      }
    } else if (formMode === 'add' && activeTab === 'banners') {
      setIsAddingBanner(true);
      setEditingBanner(null);
    } else if (formMode === 'edit' && activeTab === 'banners') {
      // Extract banner ID from URL for edit mode
      const pathMatch = location.pathname.match(/\/admin\/banners\/edit\/(\d+)/);
      if (pathMatch) {
        // TODO: Fetch banner data
        setEditingBanner({ id: parseInt(pathMatch[1]) });
        setIsAddingBanner(false);
      }
    } else if (formMode === 'add' && activeTab === 'trips') {
      setIsAddingTrip(true);
      setEditingTrip(null);
    } else if (formMode === 'edit' && activeTab === 'trips') {
      // Extract trip ID from URL for edit mode
      const pathMatch = location.pathname.match(/\/admin\/trips\/edit\/(\d+)/);
      if (pathMatch) {
        // TODO: Fetch trip data
        setEditingTrip({ id: parseInt(pathMatch[1]) });
        setIsAddingTrip(false);
      }
    } else if (!formMode) {
      // Reset form states when not in form mode
      setIsAddingApp(false);
      setEditingApp(null);
      setIsAddingBanner(false);
      setEditingBanner(null);
      setIsAddingTrip(false);
      setEditingTrip(null);
      setIsAddingCategory(false);
      setEditingCategory(null);
    }
  }, [formMode, activeTab, location.pathname, applications]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <ShellLayout variant="admin" showStats>
        <div className="flex items-center justify-center h-full">
          <Skeleton className="w-8 h-8" />
        </div>
      </ShellLayout>
    );
  }

  // Return null if not authenticated (will redirect in useEffect)
  if (!isAuthenticated) {
    return <div>Access denied</div>;
  }

  // Compute breadcrumb based on current state
  const getBreadcrumbExtra = () => {
    if (activeTab === 'dashboard') return 'Dashboard';
    if (activeTab === 'applications') {
      if (editingApp) return 'Edit';
      if (isAddingApp) return 'Add';
      return undefined;
    }
    if (activeTab === 'banners') {
      if (editingBanner) return 'Edit';
      if (isAddingBanner) return 'Add';
      return undefined;
    }
    if (activeTab === 'trips') {
      if (editingTrip) return 'Edit';
      if (isAddingTrip) return 'Add';
      return undefined;
    }
    if (activeTab === 'categories') {
      if (editingCategory) return 'Edit';
      if (isAddingCategory) return 'Add';
      return undefined;
    }
    if (activeTab === 'storage') return undefined;
    return undefined;
  };

  return (
    <>
      <ShellLayout
        variant="admin"
        showStats
        showContactWidget={false}
        breadcrumbExtra={getBreadcrumbExtra()}>
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <AdminDashboard
            stats={stats}
            pendingApps={applications.filter((app) => app.status === 'pending')}
            onViewPending={() => {
              navigate('/admin/applications');
            }}
          />
        )}

        {/* Applications List */}
        {activeTab === 'applications' && !editingApp && !isAddingApp && (
          <AdminApplications
            applications={applications}
            onRefresh={fetchApplications}
            onStatusFilterChange={() => {}}
            onSearchChange={() => {}}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteApplication}
            onApprove={(appId) => handleStatusChange(appId, 'approved')}
            onReject={(appId) => handleStatusChange(appId, 'rejected')}
            showAddButton={true}
            onAdd={() => setIsAddingApp(true)}
            currentPage={applicationsCurrentPage}
            onPageChange={setApplicationsCurrentPage}
          />
        )}

        {/* Application Form (Add/Edit) */}
        {activeTab === 'applications' && (editingApp || isAddingApp) && (
          <AdminApplicationForm
            categories={categories}
            initialData={editingApp}
            onSubmit={async (formData) => {
              const token = storage.getAuthToken();
              if (!token) return;

              try {
                // Show loading toast
                const loadingToast = toast({
                  title: 'Saving application...',
                  variant: 'loading',
                });

                const url = editingApp
                  ? `${getApiUrl()}/apps/${editingApp.id}`
                  : `${getApiUrl()}/apps`;

                const response = await fetch(url, {
                  method: editingApp ? 'PUT' : 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                  body: formData,
                });

                if (response.ok) {
                  await fetchApplications();
                  await fetchStats();

                  // Dismiss loading toast and show success
                  loadingToast.dismiss();
                  toast({ title: TOAST_MESSAGES.APPLICATION_SAVED, variant: 'success' });

                  setEditingApp(null);
                  setIsAddingApp(false);

                  // Navigate after a short delay
                  setTimeout(() => {
                    navigate('/admin/applications');
                  }, 500);
                } else if (response.status === 401 || response.status === 403) {
                  loadingToast.dismiss();
                  logout();
                  navigate('/admin/login');
                } else {
                  throw new Error('Failed to save application');
                }
              } catch (error) {
                if (import.meta.env.DEV) console.error('Error saving application:', error);
                toast({ title: TOAST_MESSAGES.FAILED_SAVE_APPLICATION, variant: 'destructive' });
              }
            }}
            onCancel={() => {
              setEditingApp(null);
              setIsAddingApp(false);
              navigate('/admin/applications');
            }}
            mode={editingApp ? 'edit' : 'create'}
            compact={false}
          />
        )}

        {/* Categories List */}
        {activeTab === 'categories' && !editingCategory && !isAddingCategory && (
          <AdminCategories
            categories={categories}
            onEdit={setEditingCategory}
            onAdd={() => setIsAddingCategory(true)}
            onDelete={handleDeleteCategory}
            onStatusToggle={handleCategoryStatusToggle}
            onRefresh={fetchCategories}
            isRefreshing={initialDataLoading}
            currentPage={categoriesCurrentPage}
            onPageChange={setCategoriesCurrentPage}
            onBulkDelete={handleBulkDeleteCategories}
            onBulkActivate={handleBulkActivateCategories}
            onBulkDeactivate={handleBulkDeactivateCategories}
          />
        )}

        {/* Banners List */}
        {activeTab === 'banners' && !editingBanner && !isAddingBanner && (
          <AdminBanners
            banners={banners}
            onEdit={setEditingBanner}
            onAdd={() => setIsAddingBanner(true)}
            onPageChange={setBannersCurrentPage}
          />
        )}

        {/* Trips List */}
        {activeTab === 'trips' && !editingTrip && !isAddingTrip && (
          <AdminTrips
            trips={trips}
            onEdit={setEditingTrip}
            onAdd={() => setIsAddingTrip(true)}
            onPageChange={setTripsCurrentPage}
          />
        )}

        {/* Storage List */}
        {activeTab === 'storage' && <AdminStorage />}

        {/* Category Form (Add/Edit) */}
        {activeTab === 'categories' && (editingCategory || isAddingCategory) && (
          <CategoryForm
            category={editingCategory}
            categories={categories}
            onSubmit={async (formData) => {
              const token = storage.getAuthToken();
              if (!token) return;

              // Show loading toast
              const loadingToast = toast({
                title: 'Saving category...',
                variant: 'loading',
              });

              try {
                const url = editingCategory
                  ? `${getApiUrl()}/categories/${editingCategory.id}`
                  : `${getApiUrl()}/categories`;
                const method = editingCategory ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                  body: formData,
                });

                if (response.ok) {
                  await fetchCategories();

                  // Dismiss loading toast and show success
                  loadingToast.dismiss();
                  toast({ title: TOAST_MESSAGES.CATEGORY_SAVED, variant: 'success' });

                  // Clear form states first, then navigate
                  setEditingCategory(null);
                  setIsAddingCategory(false);
                  // Small delay to ensure form unmounts before navigation
                  setTimeout(() => {
                    navigate('/admin/categories');
                  }, 100);
                } else if (response.status === 401 || response.status === 403) {
                  loadingToast.dismiss();
                  logout();
                  navigate('/admin/login');
                } else {
                  // Try to get error details from response
                  let errorMessage = 'Failed to save category';
                  try {
                    const errorData = await response.json();
                    errorMessage = errorData?.message || errorData?.error || errorMessage;
                  } catch {
                    errorMessage = `Server error: ${response.status}`;
                  }
                  throw new Error(errorMessage);
                }
              } catch (error: any) {
                loadingToast.dismiss();
                if (import.meta.env.DEV) console.error('Error saving category:', error);
                toast({
                  title: TOAST_MESSAGES.FAILED_SAVE_CATEGORY,
                  description: error?.message || 'Unknown error',
                  variant: 'destructive',
                });
              }
            }}
            onCancel={() => {
              setEditingCategory(null);
              setIsAddingCategory(false);
              navigate('/admin/categories');
            }}
          />
        )}

        {/* Banner Form (Add/Edit) */}
        {activeTab === 'banners' && (editingBanner || isAddingBanner) && (
          <BannerForm
            banner={editingBanner}
            onSubmit={async (formData) => {
              const token = storage.getAuthToken();
              if (!token) return;

              // Show loading toast
              const loadingToast = toast({
                title: 'Saving banner...',
                variant: 'loading',
              });

              try {
                const url = editingBanner
                  ? `${getApiUrl()}/banners/${editingBanner.id}`
                  : `${getApiUrl()}/banners`;
                const method = editingBanner ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                  body: formData,
                });

                if (response.ok) {
                  await fetchBanners();

                  // Dismiss loading toast and show success
                  loadingToast.dismiss();
                  toast({ title: TOAST_MESSAGES.BANNER_SAVED, variant: 'success' });

                  // Clear form states first, then navigate
                  setEditingBanner(null);
                  setIsAddingBanner(false);
                  // Small delay to ensure form unmounts before navigation
                  setTimeout(() => {
                    navigate('/admin/banners');
                  }, 100);
                } else if (response.status === 401 || response.status === 403) {
                  loadingToast.dismiss();
                  logout();
                  navigate('/admin/login');
                } else {
                  throw new Error('Failed to save banner');
                }
              } catch (error) {
                loadingToast.dismiss();
                if (import.meta.env.DEV) console.error('Error saving banner:', error);
                toast({ title: TOAST_MESSAGES.FAILED_SAVE_BANNER, variant: 'destructive' });
              }
            }}
            onCancel={() => {
              setEditingBanner(null);
              setIsAddingBanner(false);
              navigate('/admin/banners');
            }}
          />
        )}

        {/* Trip Form (Add/Edit) */}
        {activeTab === 'trips' && (editingTrip || isAddingTrip) && (
          <TripForm
            trip={editingTrip}
            onSubmit={async (formData) => {
              const token = storage.getAuthToken();
              if (!token) return;

              // Show loading toast
              const loadingToast = toast({
                title: 'Saving trip...',
                variant: 'loading',
              });

              try {
                const url = editingTrip
                  ? `${getApiUrl()}/trips/${editingTrip.id}`
                  : `${getApiUrl()}/trips`;
                const method = editingTrip ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                  body: formData,
                });

                if (response.ok) {
                  await fetchTrips();

                  // Dismiss loading toast and show success
                  loadingToast.dismiss();
                  toast({ title: TOAST_MESSAGES.TRIP_SAVED, variant: 'success' });

                  // Clear form states first, then navigate
                  setEditingTrip(null);
                  setIsAddingTrip(false);
                  // Small delay to ensure form unmounts before navigation
                  setTimeout(() => {
                    navigate('/admin/trips');
                  }, 100);
                } else if (response.status === 401 || response.status === 403) {
                  loadingToast.dismiss();
                  logout();
                  navigate('/admin/login');
                } else {
                  throw new Error('Failed to save trip');
                }
              } catch (error) {
                loadingToast.dismiss();
                if (import.meta.env.DEV) console.error('Error saving trip:', error);
                toast({ title: TOAST_MESSAGES.FAILED_SAVE_TRIP, variant: 'destructive' });
              }
            }}
            onCancel={() => {
              setEditingTrip(null);
              setIsAddingTrip(false);
              navigate('/admin/trips');
            }}
          />
        )}

        {/* Loading Skeleton */}
        {initialDataLoading && (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}
      </ShellLayout>
      <ConfirmDialogComponent />
    </>
  );
};

export default AdminPage;
