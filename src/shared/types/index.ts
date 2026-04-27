// Export KPI types
export * from './kpi';

// Common application types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
}

// User and Auth types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Department types
export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

// KPI related common types
export interface KPICategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  level: number;
  order: number;
}

export interface KPIItem {
  id: number;
  name: string;
  description?: string;
  unit: string;
  categoryId: number;
  category?: KPICategory;
  targetValue?: number;
  actualValue?: number;
  achievementRate?: number;
}
