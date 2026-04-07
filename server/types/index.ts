export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  full_name?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  name: string;
  url: string;
  category_id: number | null;
  status: 'pending' | 'approved' | 'rejected';
  icon_thumbnail: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: number;
  title: string;
  link_url: string | null;
  image_thumbnail: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  image_thumbnail: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  totalApps: number;
  pendingApps: number;
  approvedApps: number;
  rejectedApps: number;
  totalViews: number;
  totalUsers: number;
  totalCategories: number;
  activeBanners: number;
  totalBanners: number;
  activeTrips: number;
  totalTrips: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AppsResponse {
  applications: Application[];
  pagination: PaginationInfo;
  filters: {
    search?: string;
    category_id?: number;
    sortBy: string;
    sortOrder: string;
  };
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  upload: {
    maxSize: number;
    allowedTypes: string[];
    destination: string;
  };
  database: DatabaseConfig;
  kpiDatabase: DatabaseConfig;
}
