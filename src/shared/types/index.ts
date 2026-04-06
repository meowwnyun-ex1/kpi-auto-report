/**
 * Shared Type Definitions - Matches Backend Models Exactly
 */

// ============ ENTITIES ============

export interface Application {
  id: number;
  name: string;
  url: string;
  status: string;
  view_count: number;
  is_active: boolean;
  category_id: number | null;
  created_at: string;
  updated_at: string;
  // New optimized image fields
  image_thumbnail: string | null;
  image_small: string | null;
  image_path: string | null;
  image_metadata: string | null;
  // Joined fields from categories table
  category_name?: string | null;
  category_icon?: string | null;
}

export interface Banner {
  id: number;
  title: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // New optimized image fields
  image_thumbnail: string | null;
  image_small: string | null;
  image_path: string | null;
  image_metadata: string | null;
}

export interface Trip {
  id: number;
  title: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // New optimized image fields
  image_thumbnail: string | null;
  image_small: string | null;
  image_path: string | null;
  image_metadata: string | null;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // New optimized image fields
  image_thumbnail: string | null;
  image_small: string | null;
  image_path: string | null;
  image_metadata: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============ API RESPONSES ============

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
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
