import { z } from 'zod/v4';

// ============================================
// Auth Schemas
// ============================================
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(200),
});

// ============================================
// Application Schemas
// ============================================
export const createAppSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  category: z.string().optional().nullable(),
  url: z.string().url('Invalid URL format').optional().nullable(),
});

export const updateAppSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().optional().nullable(),
  url: z.string().max(2000).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  keep_existing_icon: z.string().optional(),
});

export const appQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(20),
  search: z.string().max(200).optional().default(''),
  category: z.string().max(50).optional().default(''),
  sortBy: z
    .enum(['name', 'created_at', 'updated_at', 'view_count'])
    .optional()
    .default('created_at'),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional().default('DESC'),
  status: z.string().max(20).optional().default('approved'),
});

// ============================================
// Category Schemas
// ============================================
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(200),
  icon: z.string().max(500).optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  icon: z.string().max(500).optional().nullable(),
});

// ============================================
// Common Param Schemas
// ============================================
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('Invalid ID'),
});

export const appIdParamSchema = z.object({
  appId: z.coerce.number().int().positive('Invalid app ID'),
});

export const userIdParamSchema = z.object({
  userId: z.coerce.number().int().positive('Invalid user ID'),
});
