import { z } from 'zod/v4';

// ============================================
// Auth Schemas
// ============================================
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(200),
});

// ============================================
// KPI System Schemas
// ============================================

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

export const userIdParamSchema = z.object({
  userId: z.coerce.number().int().positive('Invalid user ID'),
});
